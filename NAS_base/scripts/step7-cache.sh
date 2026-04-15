#!/usr/bin/env bash
# NAS Stack — Step 7: Import REST configs, enable view, rebuild cache, export config
set -euo pipefail

# Prevent Git Bash (MSYS) from converting Linux paths to Windows paths
export MSYS_NO_PATHCONV=1

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> [NAS][7/7] Importing REST resource configs..."
docker compose cp yml_configs/. php:/tmp/nas_rest_configs/
docker compose exec php vendor/bin/drush config:import --partial --source=/tmp/nas_rest_configs --yes

echo "==> [NAS][7/7] Enabling maestro_task_console view..."
docker compose exec php vendor/bin/drush views:enable maestro_views_based_task_console

echo "==> [NAS][7/7] Rebuilding cache..."
docker compose exec php vendor/bin/drush cache:rebuild

#echo "==> [NAS][7/7] Exporting initial config..."
#docker compose exec php vendor/bin/drush config:export --yes

echo "==> [NAS][7/7] Done."
