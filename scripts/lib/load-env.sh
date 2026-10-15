#!/usr/bin/env bash

# Load repo-local environment variables for operational scripts.
# Existing exported variables take precedence over file values.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -n "${ESTATEDESK_ENV_LOADED:-}" ]]; then
  return 0 2>/dev/null || exit 0
fi


for env_file in "$repo_root/.env.local" "$repo_root/.env"; do
  if [[ -f "$env_file" ]]; then
    # Restore pre-existing exported values after loading repository defaults.
    estatedesk_previous_exports="$(export -p)"
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
    eval "$estatedesk_previous_exports"
    unset estatedesk_previous_exports
    break
  fi
done

export ESTATEDESK_ENV_LOADED=1