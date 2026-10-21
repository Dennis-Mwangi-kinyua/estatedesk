# EstateDesk Load Testing

This guide is for proving authenticated capacity before promising traffic targets such as 5,000 requests per minute.

## What 5,000 RPM Means

5,000 requests per minute is about 83 requests per second. For EstateDesk, the risky traffic is authenticated traffic because it usually performs session validation, permission checks, and Prisma queries.

Treat public cached traffic and logged-in application traffic separately. Passing a public-page CDN test does not prove dashboard capacity.

## Safety and interpretation

The harness only accepts GET/HEAD routes on the configured origin. Requests have a 15-second timeout, adjustable with `LOAD_REQUEST_TIMEOUT_MS`. Redirects are not followed. Use `LOAD_OUTPUT=/tmp/load-report.json` to save a report without session cookies.

Report p95/p99 latency together with achieved RPM, errors and `schedulingDelay`. A growing scheduling delay means workers cannot sustain the offered arrival rate; it is not proof of capacity even if individual request latency looks acceptable. Concurrency is in-flight requests, not a count of logged-in people.

Run against disposable local or dedicated staging environments first. Public CDN results do not establish authenticated database capacity. Increase traffic in steps and stop on unexpected errors, pool exhaustion or sustained latency above the agreed target.

Budget database connections across instances: maximum active instances × per-instance pool size, plus workers and administrative reserve, must fit the provider's connection budget. Raising `PRISMA_POOL_MAX` blindly can exhaust the database when the application scales out.

## Setup

Start with a production-like environment:

- deployed Next.js app
- production-sized PostgreSQL or staging database with realistic data volume
- production-like connection pooling
- logging and metrics enabled
- a test account in the role being exercised

Log in with a test account and use `LOAD_COOKIE_HEADER` with its exact cookie name and value. Production uses `__Host-estatedesk_session`; development uses `estatedesk_session`. Keep session cookies out of reports and version control.

Run a smoke test for an organization admin:

```bash
LOAD_BASE_URL=https://your-domain.example \
LOAD_SESSION_COOKIE=replace-with-cookie-value \
npm run load:test
```

Run a smoke test for a platform admin:

```bash
LOAD_BASE_URL=https://your-domain.example \
LOAD_SESSION_COOKIE=replace-with-cookie-value \
LOAD_ROUTE_PRESET=platform-admin \
npm run load:test
```

Use a full cookie header when the deployment requires more than one cookie:

```bash
LOAD_BASE_URL=https://your-domain.example \
LOAD_COOKIE_HEADER="estatedesk_session=replace-with-cookie-value" \
LOAD_PROFILE=baseline \
npm run load:test
```

## Profiles

The load-test runner has these built-in profiles:

| Profile | Target RPM | Duration | Default concurrency |
| --- | ---: | ---: | ---: |
| `smoke` | 60 | 1 minute | 4 |
| `baseline` | 500 | 5 minutes | 20 |
| `stage1000` | 1,000 | 5 minutes | 40 |
| `stage2500` | 2,500 | 10 minutes | 100 |
| `stage5000` | 5,000 | 15 minutes | 180 |

Example:

```bash
LOAD_BASE_URL=https://your-domain.example \
LOAD_SESSION_COOKIE=replace-with-cookie-value \
LOAD_ROUTE_PRESET=org-admin \
LOAD_PROFILE=stage1000 \
npm run load:test
```

Override any profile value:

```bash
LOAD_BASE_URL=https://your-domain.example \
LOAD_SESSION_COOKIE=replace-with-cookie-value \
LOAD_RPM=5000 \
LOAD_DURATION_SECONDS=900 \
LOAD_CONCURRENCY=180 \
npm run load:test
```

## Route Mix

The runner has two built-in route presets:

- `org-admin` for organization dashboard traffic.
- `platform-admin` for platform control-plane traffic.

The default is `org-admin`. Choose the preset that matches the cookie you are testing:

```bash
LOAD_BASE_URL=https://your-domain.example \
LOAD_SESSION_COOKIE=replace-with-cookie-value \
LOAD_ROUTE_PRESET=platform-admin \
LOAD_PROFILE=baseline \
npm run load:test
```

To customize the route mix, copy `scripts/load-test-routes.example.json` or `scripts/load-test-routes.platform-admin.json` and edit weights/status expectations.

```bash
LOAD_BASE_URL=https://your-domain.example \
LOAD_SESSION_COOKIE=replace-with-cookie-value \
LOAD_ROUTES_FILE=scripts/load-test-routes.example.json \
LOAD_PROFILE=baseline \
npm run load:test
```

`/platform/jobs` is included at a very low weight because it is an admin control-plane page with several database queries. Use a platform-admin cookie if you want that page to return `200`.

## Passing Criteria

Do not promote a stage until the previous stage is stable.

Suggested thresholds:

- error rate below 1%
- p95 latency below 1.5 seconds for normal dashboard traffic
- p99 latency below 3 seconds
- no sustained database connection saturation
- no repeated Prisma timeout/retry spikes
- no app memory growth across the run
- no unexpected 5xx responses

The runner can fail the process when thresholds are exceeded:

```bash
LOAD_BASE_URL=https://your-domain.example \
LOAD_SESSION_COOKIE=replace-with-cookie-value \
LOAD_PROFILE=baseline \
LOAD_FAIL_ON_ERROR_RATE=1 \
LOAD_FAIL_ON_P95_MS=1500 \
npm run load:test
```

When `LOAD_FAIL_ON_ERROR_RATE` is set, the runner aborts early after `250` requests by default if the live failure rate is already above that threshold. Override the sample size with `LOAD_ABORT_AFTER_REQUESTS`.

## Staged Rollout

1. Run `smoke` and fix auth, redirects, or obvious deployment issues.
2. Run `baseline` at 500 RPM and inspect database metrics.
3. Run `stage1000`; address slow queries, pool saturation, and hot dynamic pages.
4. Run `stage2500`; introduce caching or route-specific throttles where needed.
5. Run `stage5000` only after the previous stages pass without database pressure.

## What To Watch

During every run, watch:

- app CPU and memory
- request p95/p99 latency
- response status distribution
- database active connections
- slow query logs
- Prisma transient retry logs
- 429s from app or edge limits
- 5xx responses

If Postgres is the bottleneck, prioritize connection pooling, Redis/edge rate limiting, and short-lived caching for dashboard counts before scaling app instances.

## Repeat the local security and capacity review

Apply migrations to an explicitly disposable local `TEST_DATABASE_URL`, seed with `scripts/qa/seed-role-workspaces.ts`, and start a production build configured to use that same database. Set `ROLE_WORKSPACE_FIXTURE` to the resulting private fixture file.

Run `tests/e2e/authenticated-workspaces.spec.ts` against the local server first; it stores fictional session state in mode-0600 files under `/tmp`. Then run `node scripts/qa/run-capacity-smoke.mjs`. It refuses non-local targets and checks warmed public, admin and tenant routes, including an admin ramp only when earlier profiles pass. The report contains no credentials.

Run `AUDIT_BASE_URL=http://127.0.0.1:3107 npm run audit:private` for anonymous and forged-cookie denial checks. A Next.js loading shell can return HTTP 200 followed by an explicit login/denial meta redirect; the audit recognizes only those precise framework redirects. API denials and private cache/crawl headers are checked separately. Role and organization boundaries still require the browser and database integration suites.

These short, small-dataset samples establish reproducibility, not a production user-count limit. A release capacity decision needs representative staging data, realistic mixed reads/writes and think times, sustained peak testing, and pool/CPU/memory monitoring. Follow the production provider's database and instance limits; preserve backup/restore evidence before migration.
