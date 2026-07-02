#!/usr/bin/env bash
set -euo pipefail

# Sync only Web Push variables from .env into Vercel production.
#
# Usage:
#   ./scripts/sync-web-push-env.sh .env production
#
# Prerequisites:
#   npx vercel@latest login
#   npx vercel@latest link
#   Or set VERCEL_TOKEN for non-interactive use

ENV_FILE="${1:-.env}"
TARGET_ENV="${2:-production}"

PUSH_KEYS=(
  NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
  WEB_PUSH_PUBLIC_KEY
  WEB_PUSH_PRIVATE_KEY
  WEB_PUSH_SUBJECT
)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

if command -v vercel >/dev/null 2>&1; then
  VERCEL_CMD=(vercel)
elif command -v npx >/dev/null 2>&1; then
  VERCEL_CMD=(npx vercel@latest)
else
  echo "Vercel CLI is not available." >&2
  exit 1
fi

declare -A ENV_VALUES=()

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"

  if [[ -z "${line//[[:space:]]/}" || "$line" =~ ^[[:space:]]*# || "$line" != *"="* ]]; then
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

  ENV_VALUES["$key"]="$value"
done < "$ENV_FILE"

echo "Syncing Web Push env vars to Vercel ($TARGET_ENV)..."

for key in "${PUSH_KEYS[@]}"; do
  value="${ENV_VALUES[$key]-}"

  if [[ -z "$value" ]]; then
    echo "  ! missing in $ENV_FILE: $key" >&2
    exit 1
  fi

  printf '%s' "$value" | "${VERCEL_CMD[@]}" env add "$key" "$TARGET_ENV" --force
  echo "  + $key"
done

echo "Done. Redeploy production:"
echo "  npx vercel@latest --prod"