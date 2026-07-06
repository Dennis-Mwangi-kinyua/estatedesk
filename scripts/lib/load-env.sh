#!/usr/bin/env bash

# Load repo-local environment variables for operational scripts.
# Existing exported variables take precedence over file values.

if [[ -n "${ESTATEDESK_ENV_LOADED:-}" ]]; then
  return 0 2>/dev/null || exit 0
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

for env_file in "$repo_root/.env.local" "$repo_root/.env"; do
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
    break
  fi
done

export ESTATEDESK_ENV_LOADED=1