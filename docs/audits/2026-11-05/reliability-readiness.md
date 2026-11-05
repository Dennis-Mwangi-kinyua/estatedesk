# Reliability and readiness verification — 5 November 2026

## Corrections

- Raised the default database pool idle lifetime from 20 to 90 seconds to permit reuse between minute-based polls. Explicit environment overrides still apply.
- Serialized notice dates before persistent caching, coalesced concurrent lookups, disabled automatic development polling by default, and honored server retry delays.
- Added a credential-safe, read-only `npm run database:check` command. It checks connection latency, model columns, pending migrations, migration checksums, and unfinished migrations. CI runs it after applying disposable test migrations.
- Bounded client telemetry bodies to 4 KiB, checked request origins, and discarded optional reports when anonymous or when the rate limiter is unavailable.
- Delayed database-backed sitemap imports until their handlers execute, resolving the sitemap module-loading test failure.
- Included CSS, public assets, and build/deployment configuration in release fingerprints so changed theme assets invalidate old build artifacts.
- Added missing local signing-secret and application-URL configuration without changing database credentials. The local environment file is private and ignored by Git. Existing development sessions may require a new login.

Theme palette corrections and the stays unavailable state from the preceding work remain in the working tree. Pre-existing organization feature/access changes were preserved.

## Evidence

- Full unit/browser suite: 686 tests passed, zero failures or skips. A subsequently added polling browser regression test also passed.
- Disposable PostgreSQL integration suite: 31 passed, zero failures or skips. Coverage includes duplicate payments, partial/excess payments and credit, receipts, reversals, move-outs, booking races, and organization isolation.
- Web lint, web TypeScript, and mobile TypeScript checks passed.
- Final production build passed. Its release fingerprint matches the final source, including styles and public assets. All 48 native mobile backend routes are present in the artifact.
- Light/dark browser fixtures passed for public and dashboard surfaces with either device theme, including text contrast checks.
- Live read-only database check: all modeled columns present; no pending, modified, or unfinished migrations. A successful cold connection took approximately 2.3 seconds and a query approximately 0.3 seconds.
- Local development response snapshots: update notice 200 in approximately 46 ms, vacancies 200 in 0.5 seconds, stays 200 in 3.9 seconds. These are individual observations, not load-test results.
- Disposable backup checksum validation and restore succeeded. A synthetic organization record was restored and verified. Both test databases ran under `/tmp`; the temporary PostgreSQL server was stopped afterward. No real records were changed by these tests.

## Remaining external verification

- Remote database connection attempts were intermittent: one diagnostic timed out, while later checks passed. Connection reuse and request reduction do not establish that the provider/network timeout is eliminated. Restart the development server to load the new pool settings, then monitor repeated checks and real traffic.
- The local npm vulnerability audit was blocked by automatic approval review. The repository's configured GitHub CI subsequently ran its audit and identified vulnerable Zod and fast-uri versions. The release updates the web runtime to Zod 4.6.7 and fast-uri 3.1.9; CI remains responsible for confirming the audit result.
- Live payment-provider transactions, delivery/alert integrations, off-site backup retention, and deployed production behavior were not verified. Passing local configuration checks does not certify those external systems.

## Final release updates

- Admin headers offer Classic / Glass. Glass uses a single fixed appearance with 52% white panel fills and backdrop blur; Classic restores the saved light/dark preference. Switching, reloads, navigation cleanup, contrast, mobile width, and reduced transparency pass six browser checks.
- The platform dashboard heading now renders its decorative icon metadata deterministically, preventing the reported enhancement-before-hydration mismatch. Its browser hydration regression passes.
- Development realtime streams respect the background-refresh setting. Enabled streams retain reconciliation, typing protection, and reconnect behavior; browser regressions cover both enabled and disabled operation. Realtime direct connections use the shared SSL URL normalization.
- Capacity workflow temporary paths are initialized during step execution, avoiding unavailable runner context in job-level environment expressions.
- Final full-suite verification with the patched web dependencies: 689 tests passed, zero failures or skips.
