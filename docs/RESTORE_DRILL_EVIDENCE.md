# Restore Drill Evidence

Status: **BACKUP CAPTURED, CHECKSUM VERIFIED, AND RESTORED ON A DISPOSABLE LOCAL DATABASE**

Last updated: 2026-10-13

## Purpose

Prove that a recent PostgreSQL backup can be restored within acceptable RPO/RTO targets and that core business tables are intact.

## Prerequisites

- A recent production or production-like backup file
- A disposable PostgreSQL database that may be wiped
- `pg_restore` and `psql` available locally or in CI

## Backup evidence (completed)

| Field | Value |
| --- | --- |
| Date and operator | 2026-07-04 / Engineering automation |
| Backup file | `backups/estatedesk-20260704T202552Z.dump` |
| Checksum file | `backups/estatedesk-20260704T202552Z.dump.sha256` |
| Validation command | `BACKUP_FILE=./backups/estatedesk-20260704T202552Z.dump npm run backup:validate` |
| Validation result | `pg_restore --list` succeeded; checksum verified when present |

Scripts now auto-load `.env` / `.env.local` via `scripts/lib/load-env.sh`.

## Run the full restore drill

Use a **disposable** database only. Neon branch databases or a dedicated restore instance are recommended.

```bash
BACKUP_FILE=./backups/estatedesk-20260704T202552Z.dump \
RESTORE_DATABASE_URL=postgresql://user:password@host:5432/disposable_restore_db \
CONFIRM_DISPOSABLE_RESTORE_DATABASE=YES \
npm run restore:drill
```

The script in `scripts/restore-drill.sh` will:

1. Refuse to run unless `CONFIRM_DISPOSABLE_RESTORE_DATABASE=YES`
2. Verify the backup checksum when `.sha256` is present
3. Restore the backup with `pg_restore --clean --if-exists --no-owner --no-privileges`
4. Count `Organization`, `Payment`, `Tenant`, `Lease`, and `IssueTicket` rows
5. Write JSON evidence under `backups/evidence/`
6. Print restore duration and backup age (RTO/RPO observed)

## Record the evidence after full restore

Complete every field below after the disposable restore:

- Date and operator:
- Source backup timestamp and checksum: `20260704T202552Z` / see `.sha256`
- Disposable restore target:
- Restore duration (RTO observed):
- Backup age at restore time (RPO observed):
- Organization row count:
- Payment row count:
- Login smoke check result:
- Critical workflow smoke checks:
  - Organization dashboard login
  - Tenant payment history view
  - Payment verification screen
  - Issue list load
- Object-storage recovery/versioning check:
- Issues and remediation owner:
- Evidence links:
- Approved by:

## Post-drill cleanup

- Drop or rotate the disposable restore database credentials
- Store backup checksum and drill notes in your operations vault
- Update `docs/PRE_LAUNCH_STATUS.md`
## 2026-10-13 recovery drill

A fresh read-only production backup was checksum-verified and restored successfully into a newly created local PostgreSQL 18 database. The restore completed in 1 second; the backup was 45 seconds old at completion. All five core business tables were queried successfully. The production database was not modified.

Sanitized evidence: [restore-drill.json](audits/2026-10-13/restore-drill.json). The verified backup is retained with private file permissions at `backups/estatedesk-20261013T204310Z.dump`. Backup contents and row counts remain local and are not committed. The temporary restored database has been stopped and removed. This measures a local database restore, not full production infrastructure recovery. Restored application login and an end-to-end disaster recovery exercise remain unverified.


## 2026-10-17 recovery drill

A new backup of the fictional disposable test database was checksum-verified and restored to a separate local PostgreSQL database. The restore completed in 1 second; the backup was 17 seconds old at completion. Organization, payment, tenant, lease, and issue tables were queried successfully. This run includes the native push migration and does not use or modify production data.

Evidence: [restore-drill.json](audits/2026-10-17/restore-drill.json). This is a database recovery measurement, not a production RPO/RTO commitment. Off-site encrypted retention, recurring production recovery checks, and full application disaster-recovery sign-off remain open.

## 2026-10-17 pre-deployment production recovery check

A fresh production backup was checksum-verified and restored into a separate private local PostgreSQL database before release. Restore duration was 1 second and backup age was 70 seconds. All five core table queries succeeded. Backup and detailed evidence remain private; no production records are included in the repository. This verifies database restore, not application disaster recovery or off-site retention.
