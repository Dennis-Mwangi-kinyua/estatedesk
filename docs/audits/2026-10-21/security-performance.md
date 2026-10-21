# Security, SEO and capacity review — 21 October 2026

## Changes

- Print routes now receive the proxy authentication gate, private cache headers and strict script policy as well as page-level guards.
- Recovery and verification pages use noindex metadata and are excluded from sitemap/discovery manifests. Login and registration remain discoverable; nonce-based script protection remains in place.
- M-Pesa, KCB, eTIMS and WhatsApp webhook bodies are limited to 1,000,000 bytes while streaming, including requests without Content-Length. Signature checks and payment settlement logic remain in place.
- Public scheduled update notices share a 30-second tagged database cache. Publish/withdraw actions invalidate it immediately. Cached records are checked for expiry on every read. Hidden tabs do not poll, and overlapping polls are suppressed. Session and authorization data are not stored in this shared cache.
- Load requests have deadlines, permit only GET/HEAD on the configured origin, reject streamed login redirects, and report scheduling delay. Saved reports omit session cookies.
- The example pool size matches the application default of five. Instance count and worker pools must fit the hosting database's connection budget; this does not change deployed settings.

## Verified scope

Production build and its TypeScript phase passed. Targeted application ESLint and diff whitespace checks passed. The web production dependency audit reported zero known vulnerabilities. All 27 database integration tests passed with no skips against a newly initialized disposable localhost PostgreSQL database after applying repository migrations. Tests include organization isolation, concurrent bookings/settlement, revoked sessions, setup-link replay and scoped payment evidence.

The final full unit suite passed all 612 tests with no failures or skips, including load-timeout and streamed-redirect regressions. Three old fixture assumptions were corrected to provide explicit access scopes; tests now assert that omitted/unassigned scopes are rejected rather than loosening application permissions.

All ten role sign-ins and private-cache checks passed in Chromium, along with password-change, invitation-replay, expired-session and subscription gates. CSP injection rejection, anonymous private-API denial, browser forged-cookie rejection and canonical/social/robots checks passed. Initial test harness failures were corrected for Next's streamed redirect representation and HTTP-localhost cookie/canonical setup. The anonymous/forged audit passes 52 checks across 26 paths; it accepts an HTTP 200 loading shell only when it contains an explicit Next login/denial meta redirect. Role/record authorization is assessed separately by browser and integration checks. This is targeted verification, not a formal penetration test of every action and deployment component.

All 17 public endpoint checks passed on the local production build. The new regional pages and guide were included. These reports validate current source locally, not the currently deployed release or Google indexing.

## Performance evidence

Mobile lab sample: homepage LCP 1.332s, login 0.884s, services 0.956s; no observed layout shift or horizontal overflow. Ten warmed local workspaces sampled at 0.844–0.944s LCP, with no horizontal overflow or unnamed controls detected; maximum observed layout shift was 0.011. Method: 390x844 viewport, 4x CPU slowdown, 150ms simulated latency, 1.6Mbps download, three-second observation. These are single laboratory samples, not real-user Core Web Vitals or a before/after production speed claim. INP and long-session layout shift were not measured.

The first short capacity run completed 1,050 requests without errors, but the first admin sample overlapped other test processes and had p95 1.129s versus 20ms on its later ramp. It is retained as `capacity-first-sample.json`; an isolated repeat is recorded separately. Each profile runs for 15 seconds on a small synthetic dataset; public 1,200 RPM, admin 600 then 1,800 RPM, tenant 600 RPM. Eight in-flight requests maximum, or sixteen on the admin ramp. A request rate is not an online-user limit. Neither sample establishes production capacity or sustained write-heavy behavior.

Isolated repeat: all 1,050 requests completed with zero errors and no streamed login responses. Public 1,200 RPM: p95 15ms; admin 600 RPM: p95 31ms; admin 1,800 RPM: p95 20ms; tenant 600 RPM: p95 31ms. Each profile lasted 15 seconds. See `capacity-isolated.json` for achieved rates and scheduling delays. These numbers measure local warmed read requests on synthetic data, not total people supported in production.

## Release and external requirements

1. Deploy using the normal release process and apply pending migrations in the correct release order. Re-run `npm run audit:public` and `npm run audit:private` on the deployment; verify configured canonical origin and sitemap membership. No deployment or production migration was performed here.
2. Complete the private payment-proof storage and legacy URL revocation steps in `docs/security-hardening-rollout.md`. Repository guards cannot revoke already public CDN URLs or prove bucket IAM/public-access settings. Those hosting settings were not accessed.
3. Confirm the trusted ingress IP header is overwritten by your provider and origin access is restricted. Align application instance limits and database pool budgets, plus workers and administrative headroom. No hosting limits or scaling configuration was changed.
4. Use production-like staging data, mixed roles and read/write workflows for staged peak and sustained load tests. Monitor CPU, memory, query latency, connection queues, error rate and p95/p99. Stop at the agreed latency/error budget; do not extrapolate these localhost results to unlimited users.
5. Verify backup retention, restore procedures, uptime/error alerts and actual alert delivery with the hosting/operator accounts. Enable real-user Web Vitals reporting only with a monitored collection destination; the application has an opt-in reporter.
6. Verify Search Console/Bing ownership and submit the sitemap index after deployment. Webmaster accounts were not accessed in this review.

Private fixtures, passwords and browser cookie states remain outside the repository. Reports copied here contain aggregate results and synthetic route identifiers only.
