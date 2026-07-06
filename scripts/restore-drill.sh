#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=scripts/lib/load-env.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/load-env.sh"

: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required and must be disposable}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"

if [[ "${CONFIRM_DISPOSABLE_RESTORE_DATABASE:-}" != "YES" ]]; then
  echo "Refusing to restore. Set CONFIRM_DISPOSABLE_RESTORE_DATABASE=YES for a disposable drill database."
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [[ -f "$BACKUP_FILE.sha256" ]]; then
  sha256sum --check "$BACKUP_FILE.sha256"
fi

started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
started_seconds="$(date +%s)"
backup_mtime="$(date -u -r "$BACKUP_FILE" +%Y-%m-%dT%H:%M:%SZ)"

pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$RESTORE_DATABASE_URL" "$BACKUP_FILE"

org_count="$(psql "$RESTORE_DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align --command='SELECT COUNT(*) FROM "Organization";')"
payment_count="$(psql "$RESTORE_DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align --command='SELECT COUNT(*) FROM "Payment";')"
tenant_count="$(psql "$RESTORE_DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align --command='SELECT COUNT(*) FROM "Tenant";')"
lease_count="$(psql "$RESTORE_DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align --command='SELECT COUNT(*) FROM "Lease";')"
issue_count="$(psql "$RESTORE_DATABASE_URL" --set=ON_ERROR_STOP=1 --tuples-only --no-align --command='SELECT COUNT(*) FROM "IssueTicket";')"

finished_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
finished_seconds="$(date +%s)"
duration="$((finished_seconds - started_seconds))"
backup_epoch="$(date -r "$BACKUP_FILE" +%s)"
rpo_seconds="$((finished_seconds - backup_epoch))"

evidence_dir="${EVIDENCE_DIR:-./backups/evidence}"
mkdir -p "$evidence_dir"
evidence_file="$evidence_dir/restore-drill-$(date -u +%Y%m%dT%H%M%SZ).json"

cat >"$evidence_file" <<EOF
{
  "startedAt": "$started_at",
  "finishedAt": "$finished_at",
  "durationSeconds": $duration,
  "backupFile": "$BACKUP_FILE",
  "backupTimestampUtc": "$backup_mtime",
  "rpoSeconds": $rpo_seconds,
  "counts": {
    "organizations": $org_count,
    "payments": $payment_count,
    "tenants": $tenant_count,
    "leases": $lease_count,
    "issueTickets": $issue_count
  }
}
EOF

echo "Restore drill passed"
echo "Started: $started_at"
echo "Finished: $finished_at"
echo "Duration seconds (RTO observed): $duration"
echo "Backup age seconds (RPO observed): $rpo_seconds"
echo "Organization rows: $org_count"
echo "Payment rows: $payment_count"
echo "Tenant rows: $tenant_count"
echo "Lease rows: $lease_count"
echo "IssueTicket rows: $issue_count"
echo "Evidence JSON: $evidence_file"
echo "Record operator, login smoke checks, and approval in docs/RESTORE_DRILL_EVIDENCE.md"