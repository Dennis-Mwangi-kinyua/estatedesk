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

### 1,000 signed-in users

`users1000` exercises at least 1,000 distinct supplied sessions for ten minutes,
defaulting to six requests/minute per supplied session (6,000 RPM for 1,000,
12,000 RPM for 2,000 and 30,000 RPM for 5,000). There is no site-wide user cap.
The model averages one page request per user every ten seconds, with
100 requests in flight at most. This is a traffic model, not a measured capacity
claim or a test of 1,000 simultaneous password submissions. It does not simulate
browser assets, realtime streams or write workflows; those need separate tests.

On dedicated staging, create 1,000 fictional accounts in the role being tested,
sign each in, and store their sessions in a private JSON file outside the repo:

For disposable **local** PostgreSQL, `scripts/qa/seed-capacity.ts` creates 1,000–10,000
fictional managers across organizations, with units, tenants, leases, rent charges
and signed sessions. It rejects remote database URLs and repository-local session
output. Set `TEST_DATABASE_URL`, an isolated `AUTH_SECRET`, `CAPACITY_USERS` and
`LOAD_SESSIONS_FILE`, then run with the same environment and cookie mode as the
test server:

```bash
TSX_TSCONFIG_PATH=apps/web/tsconfig.json NODE_ENV=production \
node --conditions=react-server --import tsx scripts/qa/seed-capacity.ts
```

These fixtures issue sessions directly; they do not measure password verification
or login throughput. Use only fictional records and a separate test signing key.
Cloud staging provisioning needs its own explicit isolation checks; this local
seeder intentionally cannot write to a hosted database.

After building, `scripts/qa/run-capacity.mjs` starts the production server on
loopback, warms it, and runs the selected stages, stopping on failure. It records
aggregate application RSS and PostgreSQL connection/query counts. Use
`CAPACITY_INSTANCES=4` to model four independent application processes behind a
local proxy, while keeping the default five-connection pool per process. This
models horizontal scaling on one machine, not Vercel/Neon resource limits.

```bash
CAPACITY_STAGES=1000,2000,5000 CAPACITY_INSTANCES=4 \
CAPACITY_DURATION_SECONDS=600 CAPACITY_REPORT=/tmp/capacity-summary.json \
node scripts/qa/run-capacity.mjs
```

The manual **Authenticated capacity** GitHub workflow repeats this in disposable
runner infrastructure and retains only the sanitized report. It has no production
credentials, creates no production accounts and is not a deployed-staging test.

The tenants-page proxy guard uses a verified signed session as its budget key,
so users on a shared office IP do not consume each other's 30-per-minute page
allowance. Invalid/unsigned cookies retain the IP-based guard; authorization and
the separate administrative action limits still apply.

```json
[
  { "userId": "fictional-user-1", "cookieHeader": "__Host-estatedesk_session=REPLACE" },
  { "userId": "fictional-user-2", "cookieHeader": "__Host-estatedesk_session=DIFFERENT" }
]
```

Supply at least 1,000 entries with distinct IDs and cookies. IDs are fixture labels;
the harness cannot independently verify their ownership. Use accounts in the same
role for each route preset. Start with smaller session sets on `smoke`/`baseline`
and ensure every session receives at least one scheduled request before advancing.

```bash
LOAD_BASE_URL=https://dedicated-staging.example \
LOAD_SESSIONS_FILE=/private/path/test-sessions.json \
LOAD_PROFILE=users1000 \
LOAD_OUTPUT=/tmp/1000-users-report.json \
npm run load:test
```

The profile fails on an error rate above 1%, request p95 above 1.5 seconds or
scheduling-delay p95 above one second. Rate-limit and server-error responses count
as failures even if a legacy route preset lists them as expected.
Reports include supplied/exercised session
counts without user IDs or cookies. Existing role permissions and the two-device
limit per account remain enforced. A successful run must also show stable
application memory and adequate database connection/compute headroom. Run this
against dedicated staging before any production load test.

Production server bundles reuse one Prisma client/pool per application process.
That prevents separate bundles from creating additional pools in the same warm
process; it does not share pools across instances or increase database capacity.
Size hosting and database resources from measured traffic and the connection
budget described above, then repeat at 1,000, 2,000 and 5,000 sessions as needed.

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

### Equal targets across services

`scripts/load-test-routes.all-services.json` covers 18 organization service pages
with equal weights: dashboard, properties, units, tenants, leases, payments,
charges, accounting, issues, agreements, water, tax, inspections, move-outs,
short stays, community, service providers and reports. Use an account whose role
and subscription authorize these routes; redirects and denials are failures.
This workload covers page reads, not payment callbacks, mail delivery, document
generation, uploads or other writes. Those require their own sandbox workflows.

Use the same acceptance targets for every area: p95 at most 1,500 ms and error
rate at most 1%, alongside the scheduling-delay target. Set
`LOAD_FAIL_ON_ROUTE_P95_MS=1500` to gate individual routes; with error-rate
checking enabled this also rejects individual routes above the error threshold.
Set `LOAD_MIN_REQUESTS_PER_ROUTE=10` to fail runs that leave any configured route
undersampled. Reports include each route's p95, p99, errors and failing paths.
Ten samples are a coverage floor, not sufficient evidence of stable tail latency;
use longer runs and inspect the sample counts for a release decision.

For the isolated local runner, `CAPACITY_SERVICE_SCOPE=all` selects this workload.
The manual capacity workflow uses it automatically. Example after provisioning
fictional local fixtures and building the production app:

```bash
CAPACITY_SERVICE_SCOPE=all CAPACITY_STAGES=1000 CAPACITY_INSTANCES=4 \
CAPACITY_DURATION_SECONDS=600 CAPACITY_REPORT=/tmp/all-services-capacity.json \
node scripts/qa/run-capacity.mjs
```

The initial target remains 1,000 distinct active sessions at six page requests
per user per minute (6,000 RPM), with the same thresholds for each service.
This is an acceptance target, not a measured capability. The shared session
reader now overlaps independent account/membership and policy/subscription reads
without caching authorization across requests. Deploy and repeat measurements
before attributing a capacity increase to that change.

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
