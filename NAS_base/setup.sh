#!/usr/bin/env bash
# NAS Stack — setup.sh (master)
# Orchestrates the full stack installation by calling each step script in order.
#
# Usage:
#   ./setup.sh                        Run all steps (default drupal path: ./drupal)
#   ./setup.sh /path/to/drupal        Run all steps, install Drupal to given path
#   ./setup.sh /path/to/drupal -s <N> Run only step N against given path
#   ./setup.sh --step|-s <N>          Run only step N (default drupal path)
#   ./setup.sh --help|-h              Show this help
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Prevent Git Bash (MSYS) from converting Linux paths to Windows paths
export MSYS_NO_PATHCONV=1

SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# ── Step registry (ordered) ───────────────────────────────────────────────────
declare -A STEP_SCRIPTS=(
    [1]="step1-containers.sh"
    [2]="step2-composer.sh"
    [3]="step3-drupal-install.sh"
    [4]="step4-permissions.sh"
    [5]="step5-modules.sh"
    [6]="step6-settings.sh"
    [7]="step7-cache.sh"
)
declare -A STEP_LABELS=(
    [1]="Start & verify containers"
    [2]="Composer install"
    [3]="Drupal site install"
    [4]="File permissions"
    [5]="Enable modules"
    [6]="Patch settings.php"
    [7]="Cache rebuild & config export"
)
STEP_ORDER=(1 2 3 4 5 6 7)

# ── Helpers ───────────────────────────────────────────────────────────────────
usage() {
    echo ""
    echo "Usage: ./setup.sh [<drupal-path>] [--step|-s <N>] [--help|-h]"
    echo ""
    echo "  <drupal-path>      Path where Drupal will be installed (default: ./drupal)"
    echo "  (no args)          Run all steps in order (full install)"
    echo "  --step|-s <N>      Run only step N"
    echo "  --help|-h          Show this help"
    echo ""
    echo "Available steps:"
    for n in "${STEP_ORDER[@]}"; do
        printf "  %d  %s\n" "$n" "${STEP_LABELS[$n]}"
    done
    echo ""
}

run_step() {
    local n="$1"
    if [[ -z "${STEP_SCRIPTS[$n]+_}" ]]; then
        echo "ERROR: Step '$n' does not exist. Valid steps: ${STEP_ORDER[*]}"
        exit 1
    fi
    local script="$SCRIPTS_DIR/${STEP_SCRIPTS[$n]}"
    echo ""
    echo "-----------------------------------------"
    echo "  Step $n: ${STEP_LABELS[$n]}"
    echo "-----------------------------------------"
    bash "$script"
}

# ── Load environment ──────────────────────────────────────────────────────────
if [[ -f .env ]]; then
    export $(grep -v '^#' .env | xargs)
fi

# Make all step scripts executable
chmod +x "$SCRIPTS_DIR"/step*.sh

# ── Argument parsing ──────────────────────────────────────────────────────────
SINGLE_STEP=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --step|-s)
            if [[ -z "${2:-}" ]]; then
                echo "ERROR: --step requires a step number."
                usage
                exit 1
            fi
            SINGLE_STEP="$2"
            shift 2
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        /*|./*)
            # Absolute or relative path — resolve to absolute and use as DRUPAL_ROOT
            export DRUPAL_ROOT="$(cd "$(dirname "$1")" 2>/dev/null && pwd)/$(basename "$1")"
            shift
            ;;
        *)
            echo "ERROR: Unknown argument '$1'"
            usage
            exit 1
            ;;
    esac
done

# Default DRUPAL_ROOT if not set by argument or environment
export DRUPAL_ROOT="${DRUPAL_ROOT:-$PROJECT_ROOT/drupal}"

echo "  Drupal root: $DRUPAL_ROOT"
mkdir -p "$DRUPAL_ROOT"

# ── Run ───────────────────────────────────────────────────────────────────────
if [[ -n "$SINGLE_STEP" ]]; then
    echo ""
    echo "========================================="
    echo "  NAS Stack — Running Step $SINGLE_STEP Only"
    echo "========================================="
    run_step "$SINGLE_STEP"
else
    echo ""
    echo "========================================="
    echo "  NAS Stack — Full Installation (7 steps)"
    echo "========================================="
    for n in "${STEP_ORDER[@]}"; do
        run_step "$n"
    done
    echo ""
    echo "========================================="
    echo "  NAS Stack — Setup Complete"
    echo "  Site available at http://localhost:8080"
    echo "========================================="
fi

echo ""
