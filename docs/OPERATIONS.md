# EstateDesk Operations Runbook

This runbook defines the minimum production operating standard for EstateDesk.

## Health Checks

- `GET /api/health` is a cheap liveness check. It verifies the app process and required environment configuration without touching the database.
- `GET /api/health?deep=1` is a readiness check. It also runs a lightweight database query.
- Use the liveness check for frequent uptime monitoring.
- Use the deep check during deployment, after database maintenance, and from lower-frequency platform monitors.

Expected responses:

- `200` with `status: "ok"` when required configuration is present and, for deep checks, the database responds.
- `503` with `status: "degraded"` when required configuration is missing or the deep database check fails.

## Release Checklist

- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run `npx prisma migrate deploy` against the target database.
- Confirm `/api/health?deep=1` returns `200`.
- Smoke-test login, organization dashboard, tenant dashboard, caretaker dashboard, payments, water billing, and public vacancies.
- Submit or refresh the sitemap index after public page changes.

## Incident Checklist

- Confirm whether `/api/health` or `/api/health?deep=1` is failing.
- Check hosting logs for request errors and cold-start/runtime failures.
- Check database availability, connection limits, and recent migrations.
- Check notification queues and payment callbacks for backlogs.
- Identify whether impact is public marketing, authentication, organization dashboard, tenant dashboard, caretaker dashboard, or platform admin.
- Record incident start time, affected users, suspected cause, mitigation, and follow-up tasks.

## Backup And Recovery Standard

- Keep automated PostgreSQL backups enabled in the production database provider.
- Retain daily backups for at least 30 days.
- Retain weekly backups for at least 90 days for paid production environments.
- Run a restore drill before launch and at least once per quarter.
- Document the latest successful restore drill date, operator, database snapshot, and recovery time.
- Treat file storage as production data. Confirm S3 bucket versioning or provider-level object recovery is enabled where available.

## Security Operating Standard

- Rotate platform admin passwords and API keys when staff access changes.
- Review platform audit logs weekly during early production.
- Review failed login spikes and rate-limit activity after incidents.
- Keep private dashboards, platform routes, API routes, print routes, reset flows, and invite flows marked `noindex`.
- Require strong secrets for `AUTH_SECRET`, `CRON_SECRET`, and platform admin controls.

## Monitoring Targets

- Uptime: 99.9% for production once paid customers rely on the system.
- Liveness check: every 1-5 minutes.
- Deep readiness check: every 5-15 minutes.
- Alert on two consecutive deep readiness failures.
- Alert on failed notification cron runs, failed payment callbacks, and repeated database connection failures.
- Configure `SENTRY_DSN` or an equivalent provider before production launch.
- Configure `NEXT_PUBLIC_STATUS_PAGE_URL` when an external public status page is available.
- Configure `ALERT_WEBHOOK_URL` only for trusted internal alerting destinations.

## Authenticated Load Testing

- Use `docs/LOAD_TESTING.md` before promising authenticated capacity targets such as 5,000 requests per minute.
- Run stages in order: `smoke`, `baseline`, `stage1000`, `stage2500`, then `stage5000`.
- Do not advance when p95 latency, 5xx rates, Prisma retries, or database connection usage are unstable.
- Capture the load-test summary together with hosting and database metrics for every run.

## GitHub Uptime Workflow

- `.github/workflows/uptime.yml` can run health checks every 15 minutes.
- Set repository variable `HEALTHCHECK_ENABLED=true` to enable the workflow.
- Set repository secret `HEALTHCHECK_URL` to the deployed origin, for example `https://estatedesk.co.ke`.
- Keep external uptime monitoring as the primary alerting path if the GitHub Actions quota or outage behavior is not acceptable for production.

## Scheduled Production Jobs

- `.github/workflows/cron.yml` schedules notification processing every ten minutes and retention review daily.
- Set `PRODUCTION_CRON_ENABLED=true`, `PRODUCTION_APP_URL`, and `PRODUCTION_CRON_SECRET` in repository settings.
- Hosting-provider cron is preferred when it offers stronger delivery guarantees; do not enable two schedulers without accepting duplicate idempotent calls.
- Cron failures are recorded in the jobs table and should alert through `SECURITY_ALERT_WEBHOOK_URL`.

## Backup And Restore Commands

- `npm run backup:database` creates a custom-format PostgreSQL dump plus SHA-256 checksum.
- `npm run restore:drill` refuses to run unless a disposable restore URL and explicit confirmation are supplied.
- Complete `docs/RESTORE_DRILL_EVIDENCE.md`; scripts do not constitute a completed production drill by themselves.

## Test Standard

- `npm test` runs the TypeScript unit tests through Node's built-in test runner and `tsx`.
- Add tests beside the domain risk: ledger, payment allocation, permissions, public SEO helpers, and M-Pesa callbacks should receive coverage before large changes.
- Every pull request should pass lint, typecheck, and tests through `.github/workflows/quality.yml`.

## Next Maturity Steps

- Add Sentry or OpenTelemetry-backed error tracking.
- Add Playwright smoke tests for role-based workflows.
- Add ledger and permission integration tests.
- Add M-Pesa callback replay/idempotency tests.
- Add a public trust center with privacy, terms, security, and status pages.
