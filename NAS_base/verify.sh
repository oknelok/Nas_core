#!/usr/bin/env bash
# NAS Stack — verify.sh
# Checks that Drupal, Maestro, and Webform are installed and enabled.
set -euo pipefail

PASS=0
FAIL=0

check() {
    local label="$1"
    local cmd="$2"
    if docker compose exec php bash -c "$cmd" &>/dev/null; then
        echo "  [PASS] $label"
        ((PASS++)) || true
    else
        echo "  [FAIL] $label"
        ((FAIL++)) || true
    fi
}

echo "==> [NAS] Running verification checks..."
echo ""

# Drupal bootstrap
check "Drupal bootstrap (drush status)" \
    "drush status --field=drupal-version | grep -E '^[0-9]+'"

# Core modules from the protocol
for module in serialization rest jsonapi webform maestro; do
    check "Module enabled: $module" \
        "drush pm:list --status=enabled --field=name | grep -w '$module'"
done

# JSON:API endpoint responds
check "JSON:API endpoint reachable" \
    "curl -sf http://localhost/jsonapi | grep -q 'jsonapi'"

echo ""
echo "==> Results: ${PASS} passed, ${FAIL} failed."
[[ $FAIL -eq 0 ]] && exit 0 || exit 1
