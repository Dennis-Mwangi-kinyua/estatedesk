#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=scripts/lib/load-env.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/load-env.sh"

: "${BACKUP_FILE:?BACKUP_FILE is required}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

checksum_file="$BACKUP_FILE.sha256"
if [[ -f "$checksum_file" ]]; then
  sha256sum --check "$checksum_file"
else
  echo "Warning: checksum file missing at $checksum_file"
fi

table_count="$(pg_restore --list "$BACKUP_FILE" | grep -c 'TABLE DATA' || true)"
started_seconds="$(date +%s)"
pg_restore --list "$BACKUP_FILE" >/dev/null
finished_seconds="$(date +%s)"

backup_size_bytes="$(wc -c < "$BACKUP_FILE" | tr -d ' ')"
backup_mtime="$(date -u -r "$BACKUP_FILE" +%Y-%m-%dT%H:%M:%SZ)"

echo "Backup validation passed"
echo "Backup file: $BACKUP_FILE"
echo "Backup size bytes: $backup_size_bytes"
echo "Backup modified at (UTC): $backup_mtime"
echo "Table data entries: $table_count"
echo "Catalog read duration seconds: $((finished_seconds - started_seconds))"
echo "Next step: run restore drill against a disposable database with npm run restore:drill"