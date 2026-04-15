#!/usr/bin/env bash
# NAS Stack — Step 6: Patch settings.php with NAS-required config
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

SETTINGS="web/sites/default/settings.php"

echo "==> [NAS][6/7] Patching settings.php..."

# Drupal sets settings.php to 444 after site:install — unlock, patch, re-lock
docker compose exec php chmod 644 "$SETTINGS"

docker compose exec php bash -c "cat >> $SETTINGS <<'EOF'

// NAS Stack additions
\$settings['file_chmod_directory'] = 0775;
\$settings['file_chmod_file'] = 0664;
\$settings['trusted_host_patterns'] = ['^localhost$'];
EOF"

docker compose exec php chmod 444 "$SETTINGS"

echo "==> [NAS][6/7] settings.php patched."
