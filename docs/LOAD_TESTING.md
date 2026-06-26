# EstateDesk Load Testing

This guide is for proving authenticated capacity before promising traffic targets such as 5,000 requests per minute.

## What 5,000 RPM Means

5,000 requests per minute is about 83 requests per second. For EstateDesk, the risky traffic is authenticated traffic because it usually performs session validation, permission checks, and Prisma queries.

Treat public cached traffic and logged-in application traffic separately. Passing a public-page CDN test does not prove dashboard capacity.

## Setup

Start with a production-like environment:

- deployed Next.js app
- production-sized PostgreSQL or staging database with realistic data volume
- production-like connection pooling
- logging and metrics enabled
- a test account in the role being exercised

Log in with the test account in a browser and copy the `estatedesk_session` cookie value.

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
