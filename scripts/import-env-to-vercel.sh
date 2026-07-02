#!/usr/bin/env bash
set -euo pipefail

# Bulk-import variables from a dotenv file into a linked Vercel project.
#
# Usage:
#   ./scripts/import-env-to-vercel.sh .env production
#   ./scripts/import-env-to-vercel.sh .env preview
#   ./scripts/import-env-to-vercel.sh .env development
#
# Prerequisites:
#   npm i -g vercel
#   vercel login
#   vercel link

ENV_FILE="${1:-.env}"
TARGET_ENV="${2:-production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI is not installed. Run: npm i -g vercel" >&2
  exit 1
fi

case "$TARGET_ENV" in
  production|preview|development) ;;
  *)
    echo "Target environment must be production, preview, or development." >&2
    exit 1
    ;;
esac

echo "Importing variables from $ENV_FILE into Vercel ($TARGET_ENV)..."

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"

  if [[ -z "${line//[[:space:]]/}" ]]; then
    continue
  fi

  if [[ "$line" =~ ^[[:space:]]*# ]]; then
    continue
  fi

  if [[ "$line" != *"="* ]]; then
    continue
  fi

  key="${line%%=*}"
  key="${key#"${key%%[![:space:]]*}"}"
  key="${key%"${key##*[![:space:]]}"}"

  value="${line#*=}"
  value="${value#"${value%%[![:space:]]*}"}"

  if [[ "$value" =~ ^\".*\"$ ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" =~ ^\'.*\'$ ]]; then
    value="${value:1:${#value}-2}"
  fi

  if [[ -z "$key" ]]; then
    continue
  fi

  printf '%s' "$value" | vercel env add "$key" "$TARGET_ENV" --force
  echo "  + $key"
done < "$ENV_FILE"

echo "Done. Redeploy production for changes to take effect:"
echo "  vercel --prod"