#!/usr/bin/env bash
# NAS Stack — Step 4: Fix file permissions on sites/default/files
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

export MSYS_NO_PATHCONV=1

echo "==> [NAS][4/7] Fixing file permissions..."

# On Windows bind mounts, ownership from drush site:install is not preserved.
# Run as root: create dirs, set ownership and permissions for www-data.
docker compose exec php bash -c "
    mkdir -p \
        /var/www/html/web/sites/default/files/css \
        /var/www/html/web/sites/default/files/js \
        /var/www/html/web/sites/default/files/php && \
    chown -R www-data:www-data \
        /var/www/html/web/sites/default/files && \
    chmod -R 775 \
        /var/www/html/web/sites/default/files
"

echo "==> [NAS][4/7] Permissions set."
