# Drupal Maestro Frontend

A [Next.js 14](https://nextjs.org/) (React) frontend for the Drupal Maestro workflow system. It communicates with a Drupal backend via a proxied API and uses [NextAuth.js](https://next-auth.js.org/) for session management.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation](#installation)
- [Running the Development Server](#running-the-development-server)
- [Building and Running for Production](#building-and-running-for-production)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later
- A running Drupal backend instance (configured via `DRUPAL_BASE_URL`)

---

## Environment Configuration

Configuration is provided through a `.env.local` file in the project root. This file is never committed to source control. A template is provided at `.env.local.example`.

### Setup

Copy the example file and edit it with your values:

```bash
cp .env.local.example .env.local
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DRUPAL_BASE_URL` | Yes | Base URL of the Drupal backend (e.g. `http://localhost` or `http://my-drupal-site.example.com`) |
| `NEXTAUTH_SECRET` | Yes | Secret key used to sign and encrypt NextAuth.js session tokens. Generate a secure value with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | The canonical public URL of this Next.js app (e.g. `http://localhost:3000`). Must match what the browser uses. |
| `NEXT_PUBLIC_REFRESH_INTERVAL` | No | Interval in milliseconds for polling task data (default if omitted: no auto-refresh). Example: `30000` for 30 seconds. |

### Example `.env.local`

```dotenv
DRUPAL_BASE_URL=http://localhost
NEXTAUTH_SECRET=<output of: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_REFRESH_INTERVAL=30000
```

> **Important:** Never use a weak or placeholder `NEXTAUTH_SECRET` in production. Always generate a cryptographically random value.

---

## Installation

Install all dependencies:

```bash
npm install
```

To install Playwright browsers for end-to-end testing (first time only):

```bash
npx playwright install
```

---

## Running the Development Server

```bash
npm run dev
```

The app will start at [http://localhost:3000](http://localhost:3000) with hot-reloading enabled. Ensure your `.env.local` is configured before starting.

---

## Building and Running for Production

### 1. Build

Compile the application into an optimized production build:

```bash
npm run build
```

Build output is placed in the `.next/` directory.

### 2. Start the Production Server

After building, start the production server:

```bash
npm start
```

The app will run at [http://localhost:3000](http://localhost:3000) (or the port configured via `PORT` environment variable).

> **Note:** The production server reads `.env.local` at startup, so ensure it is populated with production values before running `npm start`.

### Lint

Check code for style and type errors:

```bash
npm run lint
```

---

## Testing

The project uses two testing frameworks:

### Unit & Integration Tests — Jest + React Testing Library

Tests are located in the `__tests__/` directory and follow the naming pattern `*.test.{ts,tsx}`.

**Run all tests once:**

```bash
npm test
```

**Run tests in watch mode** (re-runs on file changes, useful during development):

```bash
npm run test:watch
```

Test setup files:
- `jest.globals.ts` — global variables available to all tests
- `jest.setup.ts` — runs after the test framework is installed (e.g. custom matchers from `@testing-library/jest-dom`)

MSW (Mock Service Worker) is used to intercept API calls in tests without hitting a real Drupal backend. Handlers are defined in `__tests__/mocks/drupal-handlers.ts`.

### End-to-End Tests — Playwright

E2E tests are located in `tests/e2e/` and cover browser-level flows such as authentication and task management.

**Run all E2E tests:**

```bash
npm run test:e2e
```

Playwright will automatically start a local development server (`npm run dev`) on port 3000 before running the tests. If a server is already running on that port it will be reused.

Test files:
- `tests/e2e/auth.spec.ts` — authentication flows (login, logout)
- `tests/e2e/tasks.spec.ts` — task list and task token flows

> **Note for CI:** In CI environments (`CI=true`), Playwright will not reuse an existing server and will always start a fresh one.

---

## Drupal Backend Endpoints

All Drupal endpoints are accessed through the Next.js proxy at `/api/drupal/[...path]`, which forwards requests to `DRUPAL_BASE_URL` with the authenticated session cookie attached. Two endpoints are called server-side directly (authentication).

### Authentication (server-side direct)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/user/login?_format=json` | Authenticate user — returns session cookie, CSRF token, and logout token |
| `POST` | `/user/logout?_format=json` | Invalidate the Drupal session on logout |

### Maestro Task Queue

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `api/maestro/task-console` | Fetch all pending tasks for the current user |
| `GET` | `jsonapi/maestro_queue/maestro_queue/{token}?include=process_id` | Fetch a single queue item by its token |

### Webform

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `webform_rest/{webform_id}/fields` | Fetch field definitions for a webform |
| `GET` | `webform_rest/{webform_id}/submission/{uuid}` | Load an existing submission for pre-population |
| `POST` | `webform_rest/submit` | Submit a new webform response |
| `PATCH` | `webform_rest/{webform_id}/submission/{uuid}` | Update an existing webform submission |

### File Management

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `file/upload/webform_submission/{bundle}/{field}` | Upload a file attachment; returns the Drupal file ID (`fid`) |
| `GET` | `jsonapi/file/file?filter[drupal_internal__fid]={fid}` | Fetch file metadata (name, size, MIME type, download URI) |

---

## Project Structure

```
.
├── __tests__/              # Jest unit and integration tests
│   ├── components/         # Component tests
│   ├── config/             # Config module tests
│   ├── lib/                # Library/utility tests
│   ├── mocks/              # MSW mock handlers
│   └── pages/              # Page and API route tests
├── pages/                  # Next.js pages and API routes
│   ├── api/
│   │   ├── auth/           # NextAuth handler and Drupal logout
│   │   └── drupal/         # Proxy route forwarding requests to Drupal
│   ├── tasks/              # Task list and task token pages
│   ├── dashboard.tsx
│   ├── login.tsx
│   └── index.tsx
├── tests/
│   └── e2e/                # Playwright end-to-end tests
├── .env.local              # Local environment config (not committed)
├── .env.local.example      # Template for environment config
├── jest.config.js          # Jest configuration
├── next.config.js          # Next.js configuration
├── playwright.config.ts    # Playwright configuration
└── package.json
```
