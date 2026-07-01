#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup_dir"
output="$backup_dir/estatedesk-$timestamp.dump"

pg_dump --format=custom --no-owner --no-privileges --file="$output" "$DATABASE_URL"
sha256sum "$output" > "$output.sha256"
echo "Backup created: $output"
echo "Upload it to encrypted, access-controlled storage and record retention metadata."
