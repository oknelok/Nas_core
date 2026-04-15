# NAS Stack — Starter Template

A self-contained, cloneable starter template for building Nextide Agentic System (NAS) projects. Clone it, open Claude Code, and start generating.

## What's Inside

| Component | Description |
|-----------|-------------|
| **Drupal 11** | CMS with Maestro (workflow), Webform (forms), JSON:API (decoupled) |
| **PHP 8.4-FPM** | Application server |
| **MariaDB 11** | Database |
| **Nginx 1.27** | Web server on port 8080 |
| **Claude Code integration** | `CLAUDE.md` teaches Claude the full NAS toolset |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- Bash shell (Git Bash on Windows, native on macOS/Linux)

## Quick Start

### 1. Clone and enter the project

```bash
git clone <your-repo-url> my-project
cd my-project
```

### 2. Configure environment (optional)

Edit `.env` to customise database credentials, site name, or admin password. Defaults work out of the box for local development.

### 3. Install — choose your path

**With Claude Code (recommended):**

```bash
claude
```

Then tell Claude: *"Run a fresh install"*

Claude reads `CLAUDE.md`, knows the commands, and runs the full 7-step installation for you.

**Without Claude Code (manual):**

```bash
./setup.sh ./drupal
```

### 4. Verify

```bash
./verify.sh
```

Checks Drupal bootstrap, required modules, and JSON:API endpoint. All checks should pass.

### 5. Open the site

Visit [http://localhost:8080](http://localhost:8080)

Default admin login: `admin` / `admin_secret` (change in `.env`).

## Using Claude Code

Once installed, open Claude Code from the project root:

```bash
claude
```

Claude automatically loads `CLAUDE.md` and understands these operations:

| Say this | Claude runs |
|----------|-------------|
| "Check the status" | `docker compose ps` + `drush status` |
| "Run a fresh install" | `./setup.sh ./drupal` (all 7 steps) |
| "Re-run step 5" | `./setup.sh ./drupal -s 5` |
| "Enable the token module" | `drush pm:enable token --yes` + cache rebuild |
| "Show me the PHP logs" | `docker compose logs --tail=50 php` |
| "What's wrong with my site?" | Status check → log inspection → diagnosis |

Claude will check container health before destructive operations and diagnose failures using logs before retrying.

## Installation Steps

The setup runs 7 steps in sequence. Each can be run individually with `./setup.sh ./drupal -s <N>`:

| Step | What it does | When to re-run |
|------|-------------|----------------|
| 1 | Start & verify Docker containers | After `docker-compose.yml` changes |
| 2 | Composer install (bootstrap Drupal) | After `composer.json` changes |
| 3 | Drupal site install (`drush site:install`) | Fresh database only |
| 4 | Fix file permissions | After container rebuild |
| 5 | Enable required modules | After adding modules via Composer |
| 6 | Patch `settings.php` | After site reinstall |
| 7 | Cache rebuild & config export | After any config or code change |

## Installed Modules

The template enables these Drupal modules automatically:

- **Workflow:** Maestro, Maestro Task Console, Template Builder, Utilities
- **Forms:** Webform, Webform UI, Webform REST
- **API:** Serialization, REST, RESTui, JSON:API
- **Utilities:** Admin Toolbar, Views Data Export

Additional modules installed via Composer but not enabled: Key, AI, JSON:API Extras, Module Filter.

## Project Structure

```
.
├── CLAUDE.md                  ← Claude Code instructions
├── .env                       ← Environment config (DB creds, site name)
├── .gitignore                 ← Ignores drupal/, .env.local
├── docker-compose.yml         ← Service definitions
├── docker/
│   ├── nginx/default.conf     ← Nginx config
│   └── php/
│       ├── Dockerfile         ← PHP image build
│       └── php.ini            ← PHP tuning
├── scripts/
│   ├── step1-containers.sh    ← Start Docker containers
│   ├── step2-composer.sh      ← Composer install
│   ├── step3-drupal-install.sh
│   ├── step4-permissions.sh
│   ├── step5-modules.sh
│   ├── step6-settings.sh
│   └── step7-cache.sh
├── setup.sh                   ← Master orchestrator
├── verify.sh                  ← Post-install checks
└── drupal/                    ← Generated Drupal site (gitignored)
```

## Customising for Your Project

1. **Add modules:** Tell Claude *"Add the token module"* — it runs `composer require`, `drush pm:enable`, and rebuilds cache.
2. **Change credentials:** Edit `.env` before first install, or re-run step 3 after changing.
3. **Change PHP settings:** Edit `docker/php/php.ini`, then re-run step 1 to rebuild the container.
4. **Change Nginx config:** Edit `docker/nginx/default.conf`, then `docker compose restart nginx`.

## Troubleshooting

**Containers won't start:** Check Docker Desktop is running. Run `docker compose logs` for errors.

**Composer fails (step 2):** Often a memory or timeout issue. Check `docker compose logs php`. The Dockerfile sets Composer process-timeout to 600s.

**Drupal install fails (step 3):** Usually means the database isn't ready. Re-run step 1 first, then step 3.

**Permission errors:** Re-run step 4: `./setup.sh ./drupal -s 4`

**CSS/JS not loading:** Check Nginx logs for 403/404 errors. Re-run step 4 for permissions, then step 7 to rebuild cache.

For any issue, ask Claude: *"My site is broken, help me diagnose it"* — it follows a systematic status → logs → fix workflow.
