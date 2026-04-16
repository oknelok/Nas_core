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
