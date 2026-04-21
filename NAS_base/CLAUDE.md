# NAS Stack — Claude Code Instructions

NAS Stack is a Dockerised Drupal 11 development environment (PHP 8.4-FPM, MariaDB 11, Nginx) managed via a setup script with 7 steps.

This directory is the project root. All commands run from here.

## Rules

- Always run `nas_status` before any destructive operation
- Steps must be run in order (1 → 7) on a fresh install
- If a step fails, diagnose with `nas_logs` before retrying
- Never run `nas_install` if containers are already healthy — use individual steps instead

---

## Tools

### nas_status

Check the health of the NAS Stack containers and Drupal installation.

**When to use:** Before any operation. To verify a step succeeded. To diagnose problems.

```bash
docker compose ps --format json
```

Then if containers are running:

```bash
docker compose exec php vendor/bin/drush status --format=json
```

**Returns:** Container states (running/stopped/unhealthy) and Drupal bootstrap status.

---

### nas_install

Run the full NAS Stack installation — all 7 steps in sequence.

**When to use:** Fresh install only. Do not use if any containers are already running.

```bash
./setup.sh ./drupal
```

**Steps it runs:**

1. Start & verify containers (`scripts/step1-containers.sh`)
2. Composer install / bootstrap Drupal (`scripts/step2-composer.sh`)
3. Drupal site install (`scripts/step3-drupal-install.sh`)
4. File permissions (`scripts/step4-permissions.sh`)
5. Enable required modules (`scripts/step5-modules.sh`)
6. Patch settings.php (`scripts/step6-settings.sh`)
7. Cache rebuild & config export (`scripts/step7-cache.sh`)

---

### nas_step

Run a single NAS installation step.

**When to use:** Re-running a failed step. Applying a specific change without full reinstall.

```bash
./setup.sh ./drupal -s {step}
```

**Step reference:**

| Step | Script | When to run manually |
|------|--------|----------------------|
| 1 | `scripts/step1-containers.sh` | After docker-compose.yml changes |
| 2 | `scripts/step2-composer.sh` | After composer.json changes |
| 3 | `scripts/step3-drupal-install.sh` | On fresh DB only |
| 4 | `scripts/step4-permissions.sh` | After container rebuild |
| 5 | `scripts/step5-modules.sh` | After adding modules to composer.json |
| 6 | `scripts/step6-settings.sh` | After site reinstall |
| 7 | `scripts/step7-cache.sh` | After any config/code change |

---

### nas_drush

Run a Drush command against the Drupal installation.

**When to use:** Any Drupal admin task — enabling modules, clearing cache, managing config, creating users.

```bash
docker compose exec php vendor/bin/drush {command}
```

**Common commands:**

| Task | Command |
|------|---------|
| Clear cache | `cache:rebuild` |
| Enable a module | `pm:enable {module}` |
| Export config | `config:export --yes` |
| Import config | `config:import --yes` |
| Create admin user | `user:create {name} --password={pass} --mail={mail}` |
| Drupal status | `status --format=json` |
| List modules | `pm:list --status=enabled` |
| Run updates | `updatedb --yes` |

---

### nas_configure_backend

Collect required backend configuration values and write them to `NAS_base/.env` and the backend section of `NAS/.env`.

**When to use:** Before the first `nas_install`. Whenever backend env values are missing or empty. Safe to re-run — never overwrites existing non-empty values.

**Required values to collect:**

| Variable | Default | Ask user? |
|----------|---------|-----------|
| `DB_HOST` | `mariadb` | Only if no default accepted |
| `DB_PORT` | `3306` | Only if no default accepted |
| `DB_NAME` | `drupal` | Only if no default accepted |
| `DB_USER` | `drupal` | Only if no default accepted |
| `DB_PASSWORD` | *(none)* | Yes — always |
| `DB_ROOT_PASSWORD` | *(none)* | Yes — always |
| `DRUPAL_ROOT` | `./drupal` | Only if no default accepted |

**Process:**

1. Read existing `NAS_base/.env` if present — skip any variable that already has a non-empty value
2. For each missing or empty variable, ask the user (offer the default where one exists)
3. Write all values to `NAS_base/.env`
4. Mirror all `DB_*` variables and `DRUPAL_ROOT` into the backend section of `NAS/.env` (create or update)

---

### nas_logs

Retrieve recent logs from NAS Stack containers.

**When to use:** Diagnosing a failed step. Investigating a PHP or Nginx error.

```bash
docker compose logs --tail={lines} {service}
```

**Services:** `php` | `nginx` | `mariadb` | (omit for all)
**Default lines:** 50

| Service | Common issues |
|---------|--------------|
| `php` | PHP-FPM errors, Drupal fatal errors |
| `nginx` | 404/403 on CSS/JS, upstream errors |
| `mariadb` | Connection failures, startup errors |

---

## Workflow Examples

### Fresh site install

```
1. nas_status                          # check current state
2. nas_install                         # run all 7 steps
3. nas_status                          # verify success
```

### Enable a new module

```
1. nas_drush  command="pm:enable {module} --yes"
2. nas_drush  command="cache:rebuild"
3. nas_drush  command="config:export --yes"
```

### Diagnose a broken install

```
1. nas_status                          # identify unhealthy containers
2. nas_logs   service=php              # look for PHP errors
3. nas_logs   service=nginx            # look for 404/403 patterns
4. nas_step   step={failed_step}       # re-run the failed step
```

---

## Maestro Domain Reference

> Maestro V4+ and Webform v6 only. All task types, schema keys, and patterns below are authoritative for these versions.

---

### Task Type Inventory

**Core task types** (`src/Plugin/EngineTasks/`):

| Plugin ID | Interactive | Purpose |
|---|---|---|
| `MaestroStart` | No | Workflow entry point — always the first task |
| `MaestroEnd` | No | Terminates the workflow process |
| `MaestroInteractive` | Yes | Human task with a custom PHP handler form; modal or full-page |
| `MaestroContentType` | Yes | Create or edit a Drupal content node inside the workflow |
| `MaestroManualWeb` | Yes | Directs the assigned user to an internal or external URL |
| `MaestroBatchFunction` | No | Calls a PHP batch function; supports async completion status returns |
| `MaestroIf` | No | Conditional branch — by variable comparison or last task status |
| `MaestroAnd` | No | Sync gate — waits for ALL incoming branches to complete before proceeding |
| `MaestroOr` | No | Sync gate — proceeds when ANY one incoming branch completes; use when parallel branches are optional |
| `MaestroSetProcessVariable` | No | Sets a process variable (hardcoded, arithmetic, PHP function, or SPV plugin) |
| `MaestroSpawnSubFlow` | No | Spawns a child workflow from another template |

**Submodule task types:**

| Plugin ID | Module | Interactive | Purpose |
|---|---|---|---|
| `MaestroWebform` | maestro_webform | Yes | Renders a Drupal Webform v6 for user completion inside the workflow |
| `MaestroEcaEventTask` | maestro_eca_task | No | Triggers an ECA event |
| `MaestroAITask` | maestro_ai_task | No | AI prompt execution (experimental) |

---

### Schema: Template-level structure

```yaml
id: machine_name
label: 'Human Label'
description: 'Description'
default_workflow_timeline_stage_count: 2
show_details: true
validated: true                 # must be true for the template to spawn processes
variables:
  variable_name:
    variable_id: variable_name
    variable_value: '0'
tasks:
  task_id:
    id: task_id
    tasktype: MaestroWebform        # plugin ID from table above
    label: 'Task Label'
    nextstep: next_task_id
    nextfalsestep: false_task_id    # MaestroIf only; omit or leave empty otherwise
    assignby: fixed                 # fixed: use `assigned` field; variable: use `assignto` field with a process variable name
    assignto: ''                    # process variable name when assignby is variable
    assigned: 'user:fixed:username,role:fixed:rolename'  # used when assignby is fixed
    handler: ''                     # PHP function name or URL — task-type-specific
    runonce: false
    showindetail: true
    participate_in_workflow_status_stage: true
    workflow_status_stage_number: 1
    workflow_status_stage_message: 'Stage Label'
    data: {}                        # task-type-specific block; see below
    notifications:
      notification_assignments: 'user:variable:initiator:assignment'
      assignment_enabled: false
      reminder_enabled: false
      escalation_enabled: false
      escalation_after: 0
      reminder_after: 0
      notification_assignment_subject: ''
      notification_reminder_subject: ''
      notification_escalation_subject: ''
```

---

### Schema: Task `data` block by type

> Note: `nextstep`, `nextfalsestep`, `assignby`, `assignto`, `assigned`, `handler`, `label`, and `notifications` are task-level keys, not inside `data`. The `data` block contains only task-type-specific configuration.

**MaestroWebform:**
```yaml
data:
  unique_id: submission_identifier
  webform_machine_name: webform_machine_name
  show_edit_form: true
  use_nodes_attached: false
  webform_nodes_attached_variable: ''
  webform_nodes_attached_to: ''
  skip_webform_handlers: true      # always true on non-initiating tasks to prevent recursive spawning
  redirect_to: taskconsole
  modal: notmodal                  # modal or notmodal
```

**MaestroInteractive:**
```yaml
# handler at task level — bare globally-callable PHP function name (not a method or service)
handler: my_module_approval_form
data:
  modal: modal                     # modal or notmodal
  redirect_to: taskconsole
```

**MaestroIf:**
```yaml
data:
  if:
    method: bylasttaskstatus       # bylasttaskstatus or byvariable
    variable: variable_name        # used when method is byvariable
    operator: '='                  # =, !=, <, > — used when method is byvariable
    variable_value: ''             # comparison value — used when method is byvariable
    status: '1'                    # '1' = task completed/accepted (true branch); '0' = rejected/false branch
```

**MaestroSetProcessVariable:**
```yaml
data:
  spv:
    variable: variable_name
    method: hardcoded              # hardcoded, addsubtract, bycontentfunction, byplugin
    variable_value: '0'
    spv_plugin: ''                 # plugin ID when method is byplugin
```

**MaestroBatchFunction:**
```yaml
# handler at task level — bare globally-callable PHP function name (not a method or service)
handler: my_module_batch_function_name
# data block not required for basic batch functions
```

**MaestroBatchFunction PHP signature (authoritative):**
```php
/**
 * @param int $processID
 *   The Maestro process ID.
 * @param int $queueID
 *   The Maestro queue ID.
 */
function my_module_batch_function_name($processID, $queueID) {
  // ... do work ...
  return TRUE; // TRUE = task complete; FALSE = keep task open (async)
}
```

Parameters are `$processID` and `$queueID` (both int). Return `TRUE` to signal completion to the engine, `FALSE` to leave the task open for async completion. Do NOT use `MaestroEngine::TASK_COMPLETION_NORMAL` — the return value is a plain boolean. Source: `maestro_dummy_batch_function` in `maestro_utilities/maestro_utilities.module`.

**MaestroContentType:**
```yaml
# handler at task level — /node/add/{bundle}?maestro=1
handler: '/node/add/my_bundle?maestro=1'
data:
  unique_id: node_identifier
  content_type: bundle_name
  redirect_to: taskconsole
  save_edit_later: 1
  link_to_edit: 0
  show_maestro_buttons_on_view: 0
  accept_label: ''
  reject_label: ''
  accept_redirect_to: ''
  reject_redirect_to: ''
  supply_maestro_ids_in_url: 0
```

**MaestroSpawnSubFlow:**
```yaml
# No handler required
data:
  # No top-level data keys — sub-flow settings are configured via the task edit form
  # maestro_template: set via task edit form — the template machine name to spawn
  # variables: checkboxes in task edit form select which parent variables to copy to child process (prefixed with maestro_parent_)
```

---

### Assignment format

The `assigned` field and `notification_assignments` field use a comma-separated list of directives:

| Format | Meaning |
|---|---|
| `user:fixed:username` | Assign to a specific Drupal user by username |
| `role:fixed:role_machine_name` | Assign to all users with a given role |
| `user:variable:process_var` | Assign to the user whose name is stored in a process variable |
| `role:variable:process_var` | Assign to the role whose name is stored in a process variable |

For `notification_assignments`, append the notification type as a fourth segment:
```
user:variable:initiator:assignment
user:fixed:admin:reminder
role:fixed:manager:escalation
```

---

### Webform-initiated workflow pattern

Most workflows that begin with a webform use this pattern:

1. The webform's `handlers:` section includes a `maestro` handler (the MaestroWebformHandler)
2. The handler spawns a named template when the submission reaches the `completed` state
3. The spawned workflow accesses the submission via `unique_id` on `MaestroWebform` tasks
4. All `MaestroWebform` tasks within the workflow set `skip_webform_handlers: true` to prevent recursive spawning

**Webform handler YAML block** (inside `webform.webform.{id}.yml`):
```yaml
handlers:
  spawn_maestro_workflow:
    id: maestro
    handler_id: spawn_maestro_workflow
    label: 'Spawn Maestro Workflow'
    status: true
    settings:
      maestro_template: template_machine_name
      maestro_message_success: 'Your submission has been received.'
      maestro_message_failure: 'Something went wrong. Please try again.'
      maestro_spawn_states:
        completed: completed
        draft_created: 0
        draft_updated: 0
```

---

### Webform v6 integration contract

- Field discovery: `GET /webform_rest/{webform_id}/fields`
- Submission: `POST /webform_rest/submit`
- Frontend renders via `WebformField.tsx` — supported field types: textfield, textarea, select, checkboxes, radios, date, email, number, file
- File upload: `POST /file/upload/webform_submission/{bundle}/{field}` → returns `fid` used in submission payload
- `webform_machine_name` in task data must exactly match the Drupal webform config entity `id`

---

### Canonical example references

These installed example modules are the authoritative style guide for generated workflows. When building a new workflow, follow their patterns exactly.

| Example template ID | Module | Demonstrates |
|---|---|---|
| `form_approval_flow` | `maestro_form_approval_example` | Linear approval chain, SPV flags, conditional rejection loop back to submitter, stage/status tracking, MaestroInteractive, MaestroBatchFunction, notifications via process variable |
| `maestro_ai_expense_rcpt_checking_simple` | `maestro_ai_task_vision_example` | Webform-initiated flow, MaestroWebform tasks, skip_webform_handlers pattern, process variable-driven node attachment |
