#!/usr/bin/env bash
# NAS Stack — Step 3: Install Drupal via Drush
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> [NAS][3/7] Installing Drupal..."
docker compose exec php vendor/bin/drush site:install standard \
    --db-url="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    --site-name="${DRUPAL_SITE_NAME}" \
    --account-name="${DRUPAL_ADMIN_USER}" \
    --account-pass="${DRUPAL_ADMIN_PASS}" \
    --account-mail="${DRUPAL_ADMIN_EMAIL}" \
    --yes

echo "==> [NAS][3/7] Drupal installed."
