# Restore Drill Evidence

Status: **BACKUP CAPTURED AND VALIDATED — FULL RESTORE STILL REQUIRED ON DISPOSABLE DATABASE**

Last updated: 2026-07-04

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