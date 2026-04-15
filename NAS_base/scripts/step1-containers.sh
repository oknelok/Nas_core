#!/usr/bin/env bash
# NAS Stack — Step 1: Start and verify containers
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> [NAS][1/7] Starting containers..."
docker compose up -d --build

echo "==> [NAS][1/7] Waiting for MariaDB to be healthy..."
until docker compose exec mariadb healthcheck.sh --connect --innodb_initialized 2>/dev/null; do
    sleep 2
done

echo "==> [NAS][1/7] Containers ready."
