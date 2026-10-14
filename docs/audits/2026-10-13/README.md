# Security, performance, and international SEO review

Reviewed on 13 October 2026. This is an engineering review and targeted automated testing, not an independent penetration test, legal sign-off, or a guarantee of worldwide rankings.

## Changes

- Updated compatible dependencies, including Next.js 16.4.0. Removed the shadcn generator dependency while preserving its MIT-licensed stylesheet locally. Scoped Prisma tooling overrides update `deepmerge-ts` and `mysql2`; Prisma generation, migrations, integration tests, and the production build validate compatibility.
- Wired the security proxy into `apps/web/src/proxy.ts`, where Next actually discovers it for this source layout. Retained server-side authentication/organisation checks; the proxy's cookie-shape check is not cryptographic authentication.
- Login now checks passwords before revealing suspended/disabled status, performs a normal bcrypt comparison for unknown accounts, limits attempts per IP as well as per IP/identifier, and refuses sign-in if abuse protection is unavailable. This deliberately favours protection over availability during limiter outages.
- Added fresh per-request script nonces for auth/private HTML. Framework scripts receive the nonce; injected inline scripts are blocked. Public prerendered pages retain the framework-compatible inline-script policy. Both policies prohibit inline event-handler attributes; production does not allow eval. Style attributes remain allowed for the existing UI.
- Explicitly allow only known public API paths to reach their own signature, token, or rate-limit policies; unknown and nested webhook paths stay protected. Retained anonymous liveness while blocking detailed health information.
- Removed theme-cookie reads from the root layout. A small same-origin, parser-blocking bootstrap preserves theme selection before paint. Global incident information is cached for 60 seconds, and public marketing cache directives use bounded freshness. Private pages remain uncached. Removed the framework's `X-Powered-By` response header.
- Bounded Web Vitals payloads to 4 KiB, reject cross-origin reports, and drop optional telemetry if its limiter is unavailable. Existing opt-in telemetry remains enabled by the existing local configuration; logging is not a Search Console field-performance report.
- Added distinct Africa and remote-landlord pages, links, sitemap inclusion, and truthful integration/localisation limitations. English metadata no longer advertises nonexistent language variants through Open Graph. No unverified translations were generated and the `.co.ke` domain was retained.
- Replaced retired unauthenticated sitemap ping requests with Google Search Console and Bing Webmaster API submission tooling. The tool explicitly fails when credentials are missing instead of implying success.
- Added recurring 15-minute public uptime checks and a check that detailed health remains unavailable anonymously. Can be disabled with repository variable `HEALTHCHECK_ENABLED=false`.
- Added a restore-target safety guard against configured live database identities and pooled aliases, and bounded backup connection attempts. Performed a fresh backup and actual local restore; see sanitized evidence.

## Verification

Final engineering validation completed on 14 October 2026:

| Check | Result |
| --- | --- |
| Production build and TypeScript | Passed; active Proxy included; public marketing routes prerendered |
| Unit tests | 436 passed |
| Database integration | 13 passed on a disposable local database, including organisation isolation |
| Browser suite | 77 passed across desktop/mobile; 7 optional fixture-dependent cases skipped |
| Production dependency audit | 0 known vulnerabilities |
| Full dependency audit | 5 high development-tool advisories; no critical advisories |
| Lint | 0 errors; 113 existing warnings |
| Public page/SEO endpoint audit | 8 passed locally |
| Recovery | Fresh backup checksum verified; actual local restore completed |

 Mobile baseline data is in `mobile-baseline.json`. Each route was sampled once with a 390×844 viewport, 4× CPU slowdown, 150 ms network latency, and 1.6 Mbps download. Baseline LCP was 2.312 s on the homepage, 1.924 s on login, and 1.668 s on services; sampled page-load layout shift was zero. These are lab samples from this runner, not country-specific field results or an INP assessment.

The default parallel integration run encountered shared-fixture serialization conflicts. All existing cases passed with files run sequentially, including their own deliberate concurrent-operation tests. The integration command now serializes files; financial application code was not changed. Browser fixtures that remount components now use a new document URL each time rather than relying on hash-only navigation, and wait for document load rather than unrelated background telemetry to become idle.

## Remaining external verification and limitations

- Search Console/Bing ownership and account access must be connected before actual sitemap submission, URL inspection, indexing coverage, or real-user Core Web Vitals can be reviewed. No credentials or verified property identifier were available in this session. Existing public `robots.txt` advertises the sitemap index.
- Google setup: enable Search Console API; grant a service account access to the verified property. Configure `GOOGLE_SEARCH_CONSOLE_SITE_URL` (URL-prefix or `sc-domain:estatedesk.co.ke`) and secret `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` (service-account JSON). Alternatively, the local script accepts `GOOGLE_APPLICATION_CREDENTIALS` as a file path.
- Bing setup: configure secret `BING_WEBMASTER_API_KEY` for the verified site. Set `PRODUCTION_SITEMAP_PING_ENABLED=true` to enable the authenticated weekly/manual workflow. Do not place credentials in chat or tracked files.
- Five development-tool advisories remain in the ESLint Next plugin → fast-glob/micromatch/braces dependency tree. npm offers an incompatible downgrade, and some affected packages have no patched range. These are reported in CI separately; production dependencies are audited as a blocking check. Do not use these tooling packages on untrusted input.
- Public HTML still permits inline framework scripts. Strict private-page CSP is an improvement, not a claim that all XSS or other vulnerabilities have been eliminated. Broader authenticated role, upload, payment, and API penetration testing remains a separate exercise.
- A single local restore does not prove off-site backup retention, an ongoing recovery SLA, failover readiness, or full application recovery. Store the retained backup in approved encrypted storage and repeat restores periodically.
- Country-specific legal compliance, supported payment/currency combinations, translations, and regional search demand still need validation before expansion. No international domain purchase, DNS migration, or fabricated regional capability was introduced.

## Reference documentation

- https://nextjs.org/docs/app/guides/content-security-policy
- https://nextjs.org/docs/app/api-reference/functions/cookies
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
- https://developers.google.com/webmaster-tools/v1/sitemaps/submit
- https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.submitfeed
