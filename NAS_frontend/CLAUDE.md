# NAS Frontend — Claude Code Instructions

NAS_frontend is a Next.js 14 app that renders Maestro workflow task queues as interactive webforms. It communicates with the Drupal backend exclusively through a server-side proxy (`/api/drupal/[...path]`) — the Drupal backend is never exposed directly to the browser.

All `docker compose` commands run from `NAS/` (the parent directory).

---

## Architecture

- **Auth:** NextAuth.js with a Drupal credentials provider — login calls `/user/login?_format=json`, session cookie forwarded on every proxied request
- **Task list:** `GET api/maestro/task-console` — polled on an interval, renders in `TaskTable`
- **Task form:** `GET jsonapi/maestro_queue/maestro_queue/{token}` + `GET webform_rest/{id}/fields` — renders dynamic webform fields
- **Submission:** `POST webform_rest/submit` or `PATCH webform_rest/{id}/submission/{uuid}`
- **Files:** `POST file/upload/webform_submission/{bundle}/{field}` — returns fid used in submission

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DRUPAL_BASE_URL` | Yes | Internal Docker URL to Drupal — always `http://nginx` when running in the NAS stack |
| `NEXTAUTH_SECRET` | Yes | Signs session tokens — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Public URL of this Next.js app — e.g. `http://localhost:3000` |

---

## Tools

### nas_configure_frontend

Collect required frontend configuration values and write them to the frontend section of `NAS/.env`.

**When to use:** Before `nas_frontend_build`. Whenever frontend env values are missing or empty. Safe to re-run — never overwrites existing non-empty values.

**Required values to collect:**

| Variable | Default | Ask user? |
|----------|---------|-----------|
| `NEXTAUTH_SECRET` | *(none)* | Offer to auto-generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` | Only if no default accepted |

`DRUPAL_BASE_URL` is always set to `http://nginx` in the NAS stack — do not ask the user for this value.

**Process:**

1. Read existing `NAS/.env` if present — skip any variable that already has a non-empty value
2. For `NEXTAUTH_SECRET`: if missing, ask "Generate a secret automatically? (recommended)" — if yes, run `openssl rand -base64 32` and use the output; if no, prompt for manual entry
3. For `NEXTAUTH_URL`: offer `http://localhost:3000` as default, ask user to confirm or enter a different value
4. Write values to the frontend section of `NAS/.env`

---

### nas_frontend_build

Build the NAS_frontend Docker image.

**When to use:** After `nas_configure_frontend`. After any code changes to NAS_frontend.

```bash
# From NAS/
docker compose --profile frontend build nas_frontend
```

---

### nas_frontend_status

Check whether the frontend container is running and can reach the Drupal backend.

**When to use:** After `nas_up`. To verify the frontend is healthy. To diagnose connection issues.

```bash
# Container running?
docker compose --profile frontend ps nas_frontend

# Frontend responding?
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/session

# Frontend can reach Drupal? (runs inside the container on nas_net)
docker compose --profile frontend exec nas_frontend \
  wget -q -O- http://nginx/user/login?_format=json | head -c 100
```

**Healthy state:** container status `running`, `/api/auth/session` returns `200`, Drupal login endpoint returns JSON.

---

## Adding New Tools

To extend this tool suite, add a new `### tool_name` section following the pattern above:
- **What it does** (one sentence)
- **When to use**
- **The exact commands to run**, with working directory noted
