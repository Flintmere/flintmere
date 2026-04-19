#!/usr/bin/env bash
#
# claude-ops-kit init
#
# Scaffolds a new project from this kit by renaming the TEMPLATE
# project folder and filling in the project-specific placeholders
# across memory/, .claude/skills/, and CLAUDE.md.
#
# Usage:
#   ./init.sh --name <slug> --display "<Display Name>" --domain <example.com>
#
# After running:
#   - projects/<slug>/ contains your renamed project doc stubs
#   - CLAUDE.md's load-map points at projects/<slug>/
#   - Every {{PROJECT_NAME}} / {{PROJECT_DISPLAY_NAME}} / {{PROJECT_DOMAIN}}
#     placeholder in the kit files is replaced with your values
#   - projects/allowanceguard/ remains as a reference example (optional:
#     delete it once you're comfortable)
#
# This script is idempotent for the rename step (the TEMPLATE folder
# is only renamed the first time it's found) but the sed replacement
# will run every time — if you pass different values on re-run, they
# win.

set -euo pipefail

NAME=""
DISPLAY=""
DOMAIN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)    NAME="$2"; shift 2 ;;
    --display) DISPLAY="$2"; shift 2 ;;
    --domain)  DOMAIN="$2"; shift 2 ;;
    -h|--help)
      sed -n '3,23p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown flag: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$NAME" || -z "$DISPLAY" || -z "$DOMAIN" ]]; then
  echo "Usage: ./init.sh --name <slug> --display \"<Display Name>\" --domain <example.com>" >&2
  exit 1
fi

# 1. Rename the TEMPLATE project directory to the slug.
if [[ -d "projects/TEMPLATE" ]]; then
  if [[ -e "projects/$NAME" ]]; then
    echo "projects/$NAME already exists; not renaming TEMPLATE over it." >&2
    exit 1
  fi
  mv "projects/TEMPLATE" "projects/$NAME"
  echo "renamed projects/TEMPLATE -> projects/$NAME"
fi

# 2. sed replacement across kit files. Portable form that works on
#    both BSD (macOS) and GNU sed.
SED_BACKUP_SUFFIX=".bak.$$"
replace_in_file() {
  local file="$1"
  sed -i"$SED_BACKUP_SUFFIX" \
    -e "s/{{PROJECT_NAME}}/$NAME/g" \
    -e "s/{{PROJECT_DISPLAY_NAME}}/$DISPLAY/g" \
    -e "s/{{PROJECT_DOMAIN}}/$DOMAIN/g" \
    "$file"
  rm -f "$file$SED_BACKUP_SUFFIX"
}

# Apply to every text file under the kit directories.
while IFS= read -r -d '' file; do
  replace_in_file "$file"
done < <(find memory .claude/skills projects/"$NAME" CLAUDE.md -type f \( -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" \) -print0 2>/dev/null)

echo ""
echo "Init complete."
echo "  Project:   $DISPLAY ($NAME)"
echo "  Domain:    $DOMAIN"
echo "  Docs dir:  projects/$NAME/"
echo ""
echo "Next:"
echo "  1. Edit projects/$NAME/{PROJECT,ARCHITECTURE,DESIGN,BUSINESS,STATUS}.md"
echo "  2. Optional: rm -rf projects/allowanceguard (the reference example)"
echo "  3. Open Claude Code in this directory and start building."
