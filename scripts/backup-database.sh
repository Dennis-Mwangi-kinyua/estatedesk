#!/usr/bin/env bash
set -euo pipefail

# Database dumps and checksums must remain private on shared machines.
umask 077

# shellcheck source=scripts/lib/load-env.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/load-env.sh"

backup_database_url="${BACKUP_DATABASE_URL:-${DIRECT_URL:-${DATABASE_URL:-}}}"
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-15}"
: "${backup_database_url:?DIRECT_URL or DATABASE_URL is required}"

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
output="$backup_dir/estatedesk-$timestamp.dump"

pg_dump --format=custom --no-owner --no-privileges --file="$output" "$backup_database_url"
sha256sum "$output" > "$output.sha256"
echo "Backup created: $output"
echo "Upload it to encrypted, access-controlled storage and record retention metadata."
