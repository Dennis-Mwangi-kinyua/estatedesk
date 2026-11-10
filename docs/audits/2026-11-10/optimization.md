# Optimization audit — 10 November 2026

## Changes completed

- Operating queues fetch bounded previews with full counts. Arrears selection and maintenance SLA filtering run in PostgreSQL instead of transferring every matching row.
- Dashboard accounting backlog uses a database count instead of a capped 500-payment scan.
- Financial reports render 25 tenants per page while preserving full financial totals and matching-tenant counts. The underlying ledger calculation still processes all matching records; this is not complete database pagination of accounting calculations.
- Notification email delivery uses the provider and reports acceptance only after success, with stable idempotency keys. Retries preserve routing metadata. Dispatch has bounded concurrency and a time budget; new reminders exclude disabled SMS delivery.
- Retention reporting pages organizations and limits concurrent queries. Deletion rules are unchanged.
- Added an authenticated notification cron endpoint and an optional, disabled-by-default GitHub scheduler.
- Browser tests support an installed Chrome when bundled Chromium is unavailable. Capacity measurements explicitly warm routes before timing.

## Measurements

All load data is synthetic and stored in a disposable local PostgreSQL database. These measurements do not establish production capacity or a service-level guarantee.

| Check | Baseline | Final |
| --- | --- | --- |
| Queue rows transferred per sample | 14,000 | 50 |
| Queue median duration | 700 ms | 121 ms |
| Warm protected-route load p95 | 104 ms | 101 ms |
| Final load errors | — | 0 of 1,000 requests |

Queue fixtures contain 2,000 leases, 12,000 charges, 2,000 issues and 2,000 verified payments. The final queue benchmark refreshed local database statistics; the baseline did not explicitly do so. The row-transfer reduction is clear, but the timing comparison is not a controlled universal speedup claim.

The load run used 1,000 distinct signed sessions, 1,000 requests over 60 seconds and a concurrency cap of 16 across five protected routes. The 104-to-101 ms p95 difference is ordinary measurement variation. Final p50 was 45 ms and p99 was 145 ms. Peak application RSS was approximately 961 MiB; peak observed database connections were six, including the monitoring connection.

Public-page Chrome lab checks used a 390×844 viewport, 4× CPU slowdown, 150 ms network latency and 1.6 Mbps throughput. Final LCP was 1,028 ms on home, 852 ms on login and 824 ms on services. CLS ranged from zero to approximately 0.0058, with no horizontal overflow. These are local lab observations, not field Core Web Vitals or physical-device measurements. Public transfer sizes were essentially unchanged.

Actual rendered report pages returned HTTP 200 and showed the expected first and second page for 50 matching tenants.

Sanitized evidence: [queue before](optimization-data/queue-before.json), [queue after](optimization-data/queue-after.json), [load before](optimization-data/load-before.json), [load after](optimization-data/load-after.json), [public before](optimization-data/public-before.json), [public after](optimization-data/public-after.json), [report pages](optimization-data/report-pages.json). Session cookies and credentials are excluded.

## Verification

- 741 unit/browser-backed tests passed, with no failures or skips.
- 63 integration tests passed against the guarded disposable local database, with no failures or skips.
- Targeted lint and web TypeScript checks passed. TypeScript required a 4 GiB Node heap on this workstation.
- Production web build passed.
- Mobile TypeScript and both Android/iOS Hermes exports passed. Each native bundle was approximately 3.1 MB.
- Web and mobile build artifact fingerprints matched their source after verification.

## Remaining release work and limits

The live database connectivity check still returns `ETIMEDOUT`. No live migration or customer-data mutation was performed. The organization management and recruitment migrations (`20261110170000_org_management_workflows` and `20261110180000_public_recruitment`) have not been applied to the live database by this work. No additional optimization schema migration was needed.

The changes have not been deployed. After database connectivity and migration deployment are resolved, deploy the application before enabling scheduled processing. For `.github/workflows/notifications.yml`, set repository variable `ESTATEDESK_APP_URL` to the deployed HTTPS origin, repository secret `CRON_SECRET` to the same value configured on the server, and repository variable `NOTIFICATIONS_SCHEDULE_ENABLED=true`. Keep one scheduler responsible for processing. Real-provider delivery remains unverified; tests used mocks and no live notification was sent.

The user confirmed that no test devices are available. Physical-device frame rate, memory, battery, camera, push and accessibility checks remain pending. The workstation also lacks the required Android native toolchain and cannot run an iOS simulator. Successful exports do not replace native runtime testing.

The system should not be described as fully optimized: production telemetry, representative production load, provider delivery, large-ledger computation and physical-device behavior still require validation.
