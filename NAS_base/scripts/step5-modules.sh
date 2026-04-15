#!/usr/bin/env bash
# NAS Stack — Step 5: Enable required Drupal modules
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> [NAS][5/7] Enabling required modules..."
docker compose exec php vendor/bin/drush pm:enable \
    serialization rest restui jsonapi webform webform_ui maestro \
    maestro_taskconsole maestro_template_builder maestro_utilities \
    maestro_webform webform_rest \
    views_data_export admin_toolbar simple_oauth \
    --yes

echo "==> [NAS][5/7] Modules enabled."
