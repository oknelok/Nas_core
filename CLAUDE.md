# NAS Stack — Claude Code Instructions

NAS is a full-stack Drupal + Next.js workflow automation system built on the Maestro module. It consists of:

- **NAS_base** — Drupal 11 backend (PHP 8.4-FPM, Nginx, MariaDB 11) with Maestro workflows and Webform
- **NAS_frontend** — Next.js 14 frontend that renders Maestro task queues as interactive webforms

All `docker compose` commands run from this directory (`NAS/`) unless noted otherwise.
Backend-only Drush and step operations run from `NAS_base/`.

---

## Rules

- Always run `nas_status` before any destructive operation
- Never run `nas_setup` if containers are already healthy — use individual tools instead
- `nas_configure_backend` and `nas_configure_frontend` are safe to re-run — they never overwrite existing values
- If any step fails, run `nas_logs` before retrying

## Architectural Policy (Mandatory)
1. **Technical Authority:** All workflow development MUST adhere strictly to the logic defined in `NAS_base/CLAUDE.md`.
2. **Implementation Strategy:** Prefer No-Code configuration over custom PHP. Custom Batch Functions are a "last resort" and require explicit justification in the JSON Manifest.
3. **Data Integrity:** The JSON Manifest (`.json`) is the immutable source of truth. If the code deviates from the Manifest, the Auditor Agent must reject the build.

---

## Tools

### nas_workflow_compile

Act as the **NAS Architect Agent**. Transform a Markdown specification into a deterministic JSON Manifest.

**When to use:** After the Superpowers brainstorming is complete and `{workflow-name}.md` is saved.

**Logic:**
1. Read `NAS/specs/{name}.md` and the **Maestro Domain Reference** in `NAS_base/CLAUDE.md`.
2. Generate `NAS/specs/{name}.json` following the `Maestro v4` schema.
3. **Mandatory Validations:**
   - Every `MaestroWebform` task must have a `unique_id` (default to 'submission').
   - Every `MaestroIf` task must have both `nextstep` and `nextfalsestep`.
   - Every task must have `top` and `left` coordinates (integers as strings).
   - If a flow starts via Webform, verify the `MaestroWebformHandler` is defined in the Webform YAML logic.
   - Flag any "Dead End" tasks (non-End tasks with no `nextstep`).

**Output:** A JSON manifest that serves as the single source of truth for the build phase.

---

### nas_status

Check health of all containers and services across the full stack.

**When to use:** Before any operation. To verify a step succeeded. To diagnose problems.

```bash
# From NAS/
docker compose --profile frontend ps --format json
```

Then if php container is running:

```bash
docker compose exec php vendor/bin/drush status --format=json
```

Then if frontend container is running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/session
```

**Returns:** Container states for all services + Drupal bootstrap status + frontend HTTP status.

---

### nas_up

Start the full stack (backend + frontend).

**When to use:** After configuration is complete and images are built.

```bash
# From NAS/
docker compose --profile frontend up -d
```

---

### nas_up_backend

Start the backend only (Drupal + MariaDB + Nginx). Used during initial setup before the frontend is configured.

**When to use:** During `nas_setup` before frontend configuration. When working on backend only.

```bash
# From NAS/
docker compose up -d
```

---

### nas_down

Stop all running services.

**When to use:** To reset the environment. Before a clean reinstall.

```bash
# From NAS/
docker compose --profile frontend down
```

---

### nas_logs

Tail logs from any service.

**When to use:** Diagnosing a failed step. Investigating errors.

```bash
# From NAS/
docker compose --profile frontend logs --tail=50 {service}
```

**Services:** `php` | `nginx` | `mariadb` | `nas_frontend` | (omit for all)

---

### nas_setup

Full autonomous bootstrap of the NAS stack from scratch. Runs the complete sequence below.

**When to use:** Fresh environment only. Do not run if containers are already healthy.

**Sequence:**

1. Run `nas_status` — if all services healthy, stop and report already running
2. Run `nas_configure_backend` — collect missing backend env values, write `NAS_base/.env` and `NAS/.env`
3. Run `nas_up_backend` — start backend containers, wait for mariadb healthy + php + nginx running
4. From `NAS_base/`, run `nas_install` — execute all 7 Drupal setup steps; on failure run `nas_logs service=php` and stop
5. Run `nas_configure_frontend` — collect missing frontend env values, write `NAS/.env` frontend section
6. Run `nas_frontend_build` — build the Next.js Docker image
7. Run `nas_up` — start full stack including frontend
8. Run `nas_frontend_status` — verify frontend is reachable and can reach Drupal
9. Report: stack ready at `NEXTAUTH_URL`, Drupal admin at `http://localhost:8080`

---

## Subsystem Reference

For backend operations (install steps, Drush commands, module management):
→ See `NAS_base/CLAUDE.md`

For frontend operations (env configuration, build, status):
→ See `NAS_frontend/CLAUDE.md`

---

## Workflow Development

Workflow modules are built from spec files in `NAS/specs/`. The Superpowers brainstorming skill produces the spec; `nas_workflow_build` executes the build into the running NAS stack.

For Maestro task types, schema, assignment format, and generation patterns:
→ See `NAS_base/CLAUDE.md` — Maestro Domain Reference section

---

### nas_workflow_build

Build a Maestro workflow module by executing a multi-pass build driven strictly by the JSON Manifest.

**When to use:** After `nas_workflow_compile` has produced a valid `{name}.json`.

**The Sequence:**

1. **Pass 1: Backend Mason Persona**
   - Read `NAS/specs/{name}.json`.
   - Generate `NAS_base/drupal/web/modules/custom/nas_{name}/`.
   - Strictly map the JSON `tasks` to Maestro YML files.
   - **Fix (Security):** Ensure `assigned` strings match the JSON exactly. Use the `nas_bridge` logic for entity identifiers.
   - Run `nas_drush command="pm:enable nas_{name} --yes"` and `cache:rebuild`.

2. **Pass 2: Frontend Weaver Persona**
   - Read `NAS/specs/{name}.json`.
   - Generate Next.js routes in `NAS_frontend/pages/`.
   - **Fix (April 13 Issue):** Every form submission *must* include `maestro_queue_id`, `maestro_process_id`, and `maestro_token` from the JSON API context.
   - Ensure form fields match the Webform IDs in the Manifest.

3. **Pass 3: Auditor Persona (Validation)**
   - Run `nas_status` to ensure containers are healthy.
   - Run `nas_frontend_status` to verify Next.js can reach Drupal.
   - Verify that the template was actually imported: `curl -s http://localhost:8080/jsonapi/maestro_template/maestro_template | grep nas_{name}`.

**Returns:** A "Success" report or a specific failure log for the Persona that failed.

**What it produces:**

A custom Drupal module at `NAS_base/drupal/web/modules/custom/{module_name}/`:

| File | Purpose |
|---|---|
| `{module_name}.info.yml` | Module definition; declares dependencies on `maestro`, `maestro_webform`, `webform` |
| `{module_name}.install` | `hook_install()` for any programmatic setup not covered by config |
| `{module_name}.module` | Glue code — batch functions, interactive task handlers, SPV plugins, hooks |
| `config/install/maestro.maestro_template.{id}.yml` | Maestro workflow template config |
| `config/install/webform.webform.{id}.yml` | Webform definition(s) including the Maestro spawn handler |
| `config/install/*.yml` | Any additional config (views, roles, content types if needed) |
| `CLAUDE.md` | Original spec + every generation decision made + iteration changelog |

**Sequence:**

1. Run `nas_status` — confirm all containers healthy before proceeding
2. Read the JSON manifest from `NAS/specs/{spec_file}.json`
3. Consult `NAS_base/CLAUDE.md` Maestro Domain Reference for task types, schema, and patterns
4. Generate all module files following the canonical example style: use `form_approval_flow` as the reference for approval chains with interactive tasks; use `maestro_ai_expense_rcpt_checking_simple` for webform-initiated flows with MaestroWebform tasks
5. Enable: `nas_drush command="pm:enable {module_name} --yes"` (see `nas_drush` in `NAS_base/CLAUDE.md`)
6. Rebuild cache: `nas_drush command="cache:rebuild"` (see `nas_drush` in `NAS_base/CLAUDE.md`)
7. Verify template installed: `curl -s http://localhost:8080/jsonapi/maestro_template/maestro_template | grep -w "{template_id}"`
8. Report: module name, template ID, initiating webform path

**On failure at steps 5–7:** run `nas_logs service=php` to diagnose YAML parse errors or missing dependencies before retrying.

**Module's embedded `CLAUDE.md` must contain:**
- The original spec verbatim
- Every design decision: assignment strategy chosen, variable names and their purpose, branch logic rationale
- Iteration changelog: date, what changed, why

**Iteration pattern:**

When a change is requested on an existing workflow module:
1. Read `NAS_base/drupal/web/modules/custom/{module_name}/CLAUDE.md` for full context
2. Make targeted edits to the relevant files within the module
3. Re-import or rebuild as needed (see `nas_drush` in `NAS_base/CLAUDE.md`):
   - Config files changed (`config/install/*.yml`): `nas_drush command="config:import --yes"`
   - PHP-only change (`.module` or `.install`): skip to step 4
4. Rebuild cache: `nas_drush command="cache:rebuild"` (see `nas_drush` in `NAS_base/CLAUDE.md`)
5. Update the module's `CLAUDE.md` changelog with the change and rationale

---

## Persona Guardrails

To ensure deterministic builds and specification compliance, Claude must adhere to these persona rules during workflow development:

### Architect Agent Rules
- **Manifest is Law:** Do not include speculative tasks. If it's not in the MD spec, do not put it in the JSON.
- **Connectivity First:** Ensure `initiator` variables are declared if the flow involves requestor tasks.
- **Visual Logic Conflict Resolution:** If a specification screenshot (PNG) shows a legacy task type (e.g., Batch Function for data move), but the NAS_base Domain Reference provides a No-Code equivalent (e.g., SPV Plugin), the No-Code equivalent MUST be used.

### Backend Mason Rules
- **No Vibe-Coding:** Only write PHP and YML that matches the JSON Manifest.
- **Schema Strictness:** Use `skip_webform_handlers: true` for all non-initiating MaestroWebform tasks.

### Frontend Weaver Rules
- **State Preservation:** You are responsible for ensuring the Maestro state (Token/Queue ID) is passed through the Next.js API proxy.
- **Field Alignment:** If the Manifest says a field is `textfield`, do not use a `textarea` in React.

### Auditor Rules
- **Zero Trust:** Do not assume a task exists just because the Backend Mason said it was created. Verify via JSON:API.