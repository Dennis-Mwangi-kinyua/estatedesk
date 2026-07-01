#!/usr/bin/env bash
set -euo pipefail

: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required and must be disposable}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"

if [[ "${CONFIRM_DISPOSABLE_RESTORE_DATABASE:-}" != "YES" ]]; then
  echo "Refusing to restore. Set CONFIRM_DISPOSABLE_RESTORE_DATABASE=YES for a disposable drill database."
  exit 1
fi

started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
started_seconds="$(date +%s)"
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$RESTORE_DATABASE_URL" "$BACKUP_FILE"
psql "$RESTORE_DATABASE_URL" --set=ON_ERROR_STOP=1 --command='SELECT COUNT(*) AS organizations FROM "Organization";'
psql "$RESTORE_DATABASE_URL" --set=ON_ERROR_STOP=1 --command='SELECT COUNT(*) AS payments FROM "Payment";'
finished_seconds="$(date +%s)"

echo "Restore drill passed"
echo "Started: $started_at"
echo "Duration seconds: $((finished_seconds - started_seconds))"
echo "Record the operator, backup timestamp, row-count checks, RPO, RTO, and evidence in docs/RESTORE_DRILL_EVIDENCE.md."
