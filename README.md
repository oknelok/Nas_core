# NAS — Nextide Agentic System

A portable, containerised full-stack platform for building Drupal-powered workflow automation with a decoupled Next.js frontend. Clone it, open Claude Code, and say "set up the NAS stack."

---

## What's Inside

| Component | Description |
|-----------|-------------|
| **Drupal 11** | Backend CMS with Maestro (workflows), Webform (forms), JSON:API + REST |
| **PHP 8.4-FPM** | Application server |
| **MariaDB 11** | Database |
| **Nginx 1.27** | Web server — Drupal admin at `http://localhost:8080` |
| **Next.js 14** | Decoupled frontend — task console at `http://localhost:3000` |
| **CLAUDE.md tooling** | Claude Code integration for autonomous setup and management |

---

## Specification Driven Development
 - NAS/specs houses the location for .md files which store specifications.
 - Read the README.md file in the specs folder to learn how to structure your specifications.
 - The more detailed your specifications are, the better your NAS deployment will be.

 - You create a net-new NAS-supported workflow pattern, forms and glue logic by creating a new [your-specification].md file
 - The resulting workflow solutuion will have a machine name of [your-specification] - The prefix of your .md file.
 - Add as many specification files as you see fit and let NAS build it for you.

---


## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.22 or later (includes Docker Compose v2.20+)
- [Claude Code](https://claude.ai/code) CLI
- Bash shell (Git Bash on Windows, native on macOS/Linux)

---

## Quick Start — Claude Code (Recommended)

Open Claude Code in the `NAS/` directory and say:

```
set up the NAS stack
```

Claude will:
1. Ask for your database credentials and any other missing values
2. Start the backend containers
3. Bootstrap Drupal (install, enable modules, configure REST)
4. Generate a secure `NEXTAUTH_SECRET` for the frontend
5. Build and start the Next.js frontend
6. Report when the stack is ready

---

## Quick Start — Manual

### 1. Copy and configure the environment file

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | MariaDB password for the Drupal user |
| `DB_ROOT_PASSWORD` | MariaDB root password |
| `NEXTAUTH_SECRET` | Secret for Next.js session tokens — generate with `openssl rand -base64 32` |

All other variables have working defaults.

### 2. Start the backend

```bash
docker compose up -d
```

### 3. Install Drupal

```bash
cd NAS_base
./setup.sh
cd ..
```

This runs 7 steps: start containers → composer install → Drupal install → permissions → enable modules → patch settings → cache rebuild.

### 4. Build and start the frontend

```bash
docker compose --profile frontend build
docker compose --profile frontend up -d
```

### 5. Verify

- Drupal admin: [http://localhost:8080](http://localhost:8080)
- Task console: [http://localhost:3000](http://localhost:3000)

---

## Deployment Options

| Command | What starts |
|---------|-------------|
| `docker compose --profile frontend up -d` | Full stack — backend + frontend |
| `docker compose up -d` | Backend only (Drupal + DB + Nginx) |
| `docker compose --profile frontend down` | Stop everything |

To deploy the frontend against an **existing external Drupal** instance, set `DRUPAL_BASE_URL` in `.env` to the external URL before starting.

---

## Environment Variables

All variables live in `NAS/.env` (not committed). Copy from `.env.example` to get started.

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `mariadb` | Database host (service name inside Docker) |
| `DB_PORT` | `3306` | Database port |
| `DB_NAME` | `drupal` | Database name |
| `DB_USER` | `drupal` | Database user |
| `DB_PASSWORD` | — | Database password |
| `DB_ROOT_PASSWORD` | — | MariaDB root password |
| `DRUPAL_ROOT` | `./NAS_base/drupal` | Path where Drupal is installed |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXTAUTH_SECRET` | — | Session token secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` | Public URL of the Next.js app |

> `DRUPAL_BASE_URL` is always `http://nginx` inside Docker and is set automatically — do not add it to `.env`.

---

## Claude Code Tools

When working in this repo, Claude Code has access to the following tools defined in `CLAUDE.md`:

| Tool | Description |
|------|-------------|
| `nas_setup` | Full autonomous bootstrap from scratch |
| `nas_status` | Check health of all containers and services |
| `nas_up` | Start full stack |
| `nas_up_backend` | Start backend only |
| `nas_down` | Stop all services |
| `nas_logs` | Tail logs for any service |
| `nas_configure_backend` | Collect and write backend env values |
| `nas_configure_frontend` | Collect and write frontend env values |
| `nas_frontend_build` | Build the Next.js Docker image |
| `nas_frontend_status` | Verify frontend container and Drupal connectivity |

Backend step tools (`nas_install`, `nas_step`, `nas_drush`) are documented in `NAS_base/CLAUDE.md`.

---

## Project Structure

```
NAS/
├── CLAUDE.md               # Claude Code tools — full-stack orchestration
├── docker-compose.yml      # Includes NAS_base compose + adds frontend service
├── .env.example            # Environment template
├── .env                    # Local config (not committed)
├── NAS_base/               # Drupal 11 backend
│   ├── CLAUDE.md           # Backend tools (nas_install, nas_drush, etc.)
│   ├── docker-compose.yml  # PHP-FPM + Nginx + MariaDB
│   ├── setup.sh            # 7-step Drupal bootstrap
│   └── scripts/            # Step scripts
└── NAS_frontend/           # Next.js 14 frontend
    ├── CLAUDE.md           # Frontend tools (nas_configure_frontend, etc.)
    ├── Dockerfile          # Three-stage production build
    └── pages/              # Next.js pages and API routes
```

---

## Troubleshooting

**Containers won't start**
```bash
docker compose --profile frontend logs --tail=50
```

**Drupal install fails at a specific step**

In Claude Code: `nas_logs service=php` — or manually:
```bash
docker compose logs --tail=50 php
```
Then re-run the failed step:
```bash
cd NAS_base && ./setup.sh --step <N>
```

**Frontend can't reach Drupal**

Check both stacks are running:
```bash
docker compose --profile frontend ps
```
Verify `DRUPAL_BASE_URL` inside the container:
```bash
docker compose --profile frontend exec nas_frontend env | grep DRUPAL
```
