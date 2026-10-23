# Authenticated capacity work — 23 October 2026

## Findings

The website has no global 1,000-user cap. Registered accounts, valid sessions,
request throughput and live-stream connections are different capacity measures.
This review used fictional data in isolated local PostgreSQL and the production
Next.js build. These results do not establish Vercel/Neon production capacity.

Fixture volume: 5,000 managers, 100 organizations, 5,000 units, tenants, leases
and rent charges. Sessions were issued directly with an isolated signing key;
password verification and simultaneous login submissions were not load-tested.
No production accounts or rental records were created for these tests.

| Workload | Local result |
| --- | --- |
| Four app processes, 1,000 distinct sessions, offered 6,000 RPM | All 6,000 requests returned 200, but achieved only 2,835 RPM; p95 6,216 ms, scheduling p95 64,826 ms. Failed. Higher stages were stopped. |
| Four app processes, 1,000 sessions, 2,000 RPM for 60 seconds | Achieved 2,000 RPM, zero errors, p95 55 ms, p99 186 ms, scheduling p95 1 ms. Passed this short workload only. |
| 1,000 concurrent realtime streams during the lighter workload | All connected; the organization change reached its 50 intended recipients, with zero foreign deliveries. Passed after the portfolio-trigger fix. |

Evidence: [heavy workload](heavy-local.json), [lighter workload](moderate-local.json),
[realtime](realtime-local.json). The heavier run included the realtime admission
probe; the comparisons are different mixed workloads, not an isolated scaling
benchmark. Neither a one-minute run nor an RSS range proves memory stability.

A first longer run at 2,000 RPM was stopped at 1,949 successful requests because
recent p95 exceeded 1.5 seconds. It overlapped the full browser/unit regression
suite on the same machine and is retained as a failure, not capacity evidence:
[report](soak-with-regressions.json). A clean soak is a separate measurement.

The existing [clean-soak report](clean-soak-local.json), recovered during the
storage review, also failed: 1,000 sessions completed 10,049 requests with zero
HTTP errors in 309.5 seconds, but the recent latency window reached p95 1,673 ms
and triggered the 1,500 ms abort threshold. Aggregate p95 was 82 ms; that does
not override the sustained-window failure. The ten-minute target remains unmet.

Storage review added a 25 MiB per-file read limit, a 15-second HTTP deadline,
trusted HTTPS storage URL restrictions with redirects disabled, bounded S3
reads, encoded object URLs and custom-endpoint URL construction. These are
resource and correctness safeguards, not a new capacity benchmark. Legacy
absolute URLs must use the configured S3 public base or regional bucket origin.
Private documents should continue using authenticated download routes; generated
public URLs do not grant access to private objects.

## Changes

- Reuse one Prisma client/pool across bundles in each warm production process.
- Key the tenants-page budget by a cryptographically verified signed session.
  Invalid cookies retain the IP guard. Previously an office/NAT shared the same
  30-per-minute budget across users; the initial load run reproduced 429s.
- Add a forward migration for Unit, Building and MeterReading realtime signals.
  These tables inherit their organization through Property and were omitted by
  the original trigger discovery. Tests verify commit/rollback, organization
  changes, deletes, timestamp-only updates and identifier-only notifications.
- Add distinct-session load fixtures, sustained latency/backlog aborts, a guarded
  local seeder, multi-process test runner, realtime isolation probe and a manual
  GitHub capacity workflow. Session fixtures remain private outside the repo.
- Selected payment/property integration tests and upload regression tests passed
  alongside the local page run. This does not measure a hosted storage provider
  or live payment gateway's throughput.

## Remaining infrastructure work

- Connect Neon to provision a separate fictional staging database/compute.
  The current integration seeders intentionally refuse remote database writes.
- Deploy an isolated staging app with its own signing key and sandbox storage,
  mail, payment and messaging integrations. Do not copy production integration
  credentials or customer records into a load test.
- Repeat realistic role mixes, browser/write workflows and ten-minute-or-longer
  stages at 1,000, 2,000 and 5,000 users. Tune hosting/compute from measured
  latency, memory and connection budgets. The 6,000-RPM local target failed;
  do not raise database pools or promise that target from these results.
- Production Vercel configuration inspected: Fluid Compute enabled, function
  region iad1. No paid hosting or database plan was changed.
- `www.estatedesk.co.ke` is attached and verified in Vercel but fails public DNS
  resolution. Authoritative nameservers are Cloudoon. The DNS provider must set
  `www CNAME e0f913cc4aab26ab.vercel-dns-017.com.` (Vercel's inspected recommendation).
  No Cloudoon management connection is available in this session.

The cloud access and DNS requirements are unfinished; this is not a production
capacity sign-off.

## Authorized live checks

The owner subsequently authorized live-database testing and designated an
existing account for authenticated reads. Inventory showed 31 undeleted users,
four undeleted organizations and 14 unexpired sessions. The owner explicitly
requested force logout: only the designated account's least recently active
session was revoked, preserving its other active device. Test-session credentials
were kept in memory and are omitted from reports.

- [Direct SQL, initially lazy pool](live-db-cold-read.json) and
  [direct SQL, five warmed connections](live-db-warm-read.json): 60 operations/minute
  passed for 30 seconds; 300 operations/minute stopped after 65 successful reads
  when the recent p95 exceeded 1.5 seconds. No query failures or pool queues were
  observed. Every warmed connection was verified read-only. These are SQL
  workloads through the local client, not authenticated app requests.
- Follow-up read-only `EXPLAIN ANALYZE` samples showed server execution of
  0.019 ms for `SELECT 1`, 0.062 ms for the unit list and 0.040 ms for the lease
  list, while client round trips were 210–214 ms. These small samples do not
  establish the cause of tail spikes or production database saturation.
- [Live authenticated website, 16 in flight](live-account-read-16.json): one
  designated organization ADMIN account exercised units, properties and payments.
  The 60, 300 and 1,000 offered-RPM stages passed the configured checks for 30
  seconds each with zero HTTP errors. At the 1,000-RPM stage, 500 responses
  completed, achieved throughput was 964 RPM, p95 was 1,316 ms and p99 was
  1,937 ms. At 2,000 offered RPM, the runner's 16-request cap produced scheduling
  p95 of 1,058 ms and stopped the test. That backlog alone does not demonstrate
  an application or database capacity ceiling. The temporary session was removed.
- [Live comparison, 32 in flight](live-account-read-32.json): a separate
  2,000-offered-RPM sample stopped after 81 successful responses, zero errors,
  final p95 1,763 ms and scheduling p95 217 ms. The recent p95 abort threshold
  fired at 1,609 ms. Increasing the runner cap reduced scheduling backlog but
  did not pass the latency target. This was a short aborted probe, not a
  steady-state throughput measurement. Its temporary session was also removed;
  the 6,000-RPM live stage was not attempted.

Live probes create no users, organizations or business fixtures. Authenticated
GET handlers may update normal session presence and rate-limit records. All live
samples use one existing account and existing small data volumes; they do not
verify 1,000 distinct authenticated users or a sustained peak workload. The
local-only fixture seeder's remote-database protections remain in place.

## Release validation

- 662 unit tests passed before the additional cached-date regression (which also
  passed separately); TypeScript, lint and the pool/rate-limit production build
  passed. The final release must include a fresh build of the cached-date fix.
- Production backup: private file outside the repository, 662,352 bytes, checksum
  and catalog validated with 113 table-data entries. A catalog check is not a
  restore drill or off-site retention evidence.
- Forward migration `20261023190000_portfolio_realtime_scopes` applied to production;
  89 migrations are now applied.
- The prior Quality run passed security audit, unit tests, schema checks and
  integration tests but timed out in browser tests. Its logs exposed fixture
  router mocks missing `useRouter` and serialized vacancy dates causing HTTP 500.
  Both receive targeted fixes in this release. Other browser failures remain
  unverified until rerun; do not describe the Quality workflow as green.
