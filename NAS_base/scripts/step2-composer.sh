#!/usr/bin/env bash
# NAS Stack — Step 2: Bootstrap Drupal project via composer create-project
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Prevent Git Bash (MSYS) from converting Linux paths to Windows paths
export MSYS_NO_PATHCONV=1

DEXEC="docker compose exec php"

echo "==> [NAS][2/7] Creating Drupal project via composer create-project..."

if $DEXEC test -f /var/www/html/composer.json; then
    echo "==> [NAS][2/7] composer.json found — running composer install..."
    $DEXEC composer install --no-interaction --optimize-autoloader
else
    echo "==> [NAS][2/7] No composer.json — bootstrapping directly into /var/www/html..."
    $DEXEC composer create-project drupal/recommended-project . \
        --no-interaction \
        --no-install

    echo "==> [NAS][2/7] Disabling process timeout before full install..."
    $DEXEC composer config process-timeout 0

    echo "==> [NAS][2/7] Setting minimum stability to beta..."
    $DEXEC composer config minimum-stability beta
    $DEXEC composer config prefer-stable true

    echo "==> [NAS][2/7] Adding required contrib modules..."
    $DEXEC composer require \
        drupal/maestro:^4 \
        drupal/webform:^6.3 \
        drush/drush:^13 \
        drupal/module_filter \
        drupal/admin_toolbar \
        drupal/key \
        drupal/ai \
        drupal/webform_rest \
        drupal/views_data_export \
        drupal/restui \
        drupal/jsonapi_extras \
        drupal/simple_oauth \
        --no-interaction
fi

echo "==> [NAS][2/7] Composer complete."
