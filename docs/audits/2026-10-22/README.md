# Engineering gap review — 22 October 2026

This review covers the current local working tree, including existing uncommitted work. It does not establish production deployment or store readiness.

## Verified locally

- `npm test`: 634 tests passed, zero failures or skipped tests. Browser checks required execution outside the filesystem sandbox so Chromium could launch.
- After logout-cache changes, the full suite passed again: 636 tests, zero failures or skipped tests.
- After workspace realtime changes, the full suite passed: 641 tests, zero failures or skipped tests. The isolated local PostgreSQL integration test also passed for commit/rollback delivery, scope changes, provider applications and read-side exclusions. The disposable PostgreSQL instance was stopped afterward.
- Final realtime web build passed with `ESTATEDESK_BUILD_WITHOUT_DATABASE=true npm run build`; generated output includes `/api/realtime`. This build does not verify production migration/configuration or signed-in deployed streaming.
- `npm run typecheck` and `npm run mobile:typecheck`: passed.
- `npm run production:check`: zero missing required environment values and six optional warnings. This checks presence only; it does not authenticate providers or verify deployed configuration.
- Initial `npm run release:check -- --artifacts-only`: failed because web/mobile build stamps were stale and the existing web artifact omitted `/api/mobile/workspace/reports/export`.
- `npm run mobile:bundle`: rebuilt both iOS and Android bundles and recorded the current source fingerprint for workflow protocol 1.
- Web build completed successfully after the logout-cache changes and contained all 48 native mobile routes, including report export. Web TypeScript and targeted ESLint passed; full web ESLint also passed before the logout changes.
- Final `npm run release:check -- --artifacts-only`: passed for both source fingerprints, protocol 1 and all 48 native mobile routes. Database and deployed-backend checks were not performed.

## Remaining work, in order

1. Review and capture the complete intended release source, including untracked files. Both local artifacts now match the source; repeat builds/checks if source changes before release.
2. Verify current database migration history before releasing. The 21 October record of 81 applied migrations predates the new 22 October provider review, provider payment, submission receipt, backfill and realtime migrations; it cannot prove the current schema is deployed. Live delivery also requires a session-level direct PostgreSQL connection; see `docs/REALTIME.md`.
3. Verify the deployed mobile protocol and routes using `npm run release:check -- --origin=https://estatedesk.co.ke`, then exercise signed-in workflows on iOS and Android. Local artifacts and browser stand-ins do not establish deployed or device behavior.
4. Complete authenticated keyboard, screen-reader, contrast and zoom checks in `docs/ACCESSIBILITY_QA.md`.
5. Record off-site encrypted backup retention, scheduled backup success and recurring restore/application smoke-test evidence in `docs/RESTORE_DRILL_EVIDENCE.md`.
6. Obtain counsel sign-off in `docs/KENYA_LEGAL_REVIEW.md`; record live production payment verification, uptime alert delivery and webmaster submission evidence.
7. Complete mobile store credentials, disclosures, assets and physical-device checks. Prioritize remaining native management workflows against actual user needs; `apps/mobile/README.md` records parity limitations.

Optional environment warnings: security alert webhook, Meta WhatsApp signature secret, KRA eTIMS signature secret, KCB IPN signature secret and both web-push VAPID keys. Enable and verify these with the corresponding feature/provider; presence alone is insufficient.

No database migration, production deployment, provider transaction, account configuration or store submission was performed by this review.

## Subsequent authorized production release

The user subsequently authorized production deployment and explicitly approved configuring the sensitive `REALTIME_DATABASE_URL` in the existing Vercel project. The full production environment was not exported locally.

- Production deployment: `dpl_421aMiM2SctJN5Ji7XH1dyEz7mrB`, promoted to `https://estatedesk.co.ke` after a successful Vercel build and staged protocol check.
- Previous deployment for rollback: `dpl_HWiV7td7Zwmv1o1S2y2nr1VFZukr` (`estatedesk-ohgb1a86b-dennis-mwangis-projects.vercel.app`).
- Private pre-migration backup: `backups/estatedesk-20261022T172043Z.dump`, 628,894 bytes, checksum/catalog validated with 113 table-data entries. This is local evidence, not off-site retention or a fresh restore drill.
- Realtime migration initially failed on the existing `RegisteredIdentityOwners` view. Base-table filtering was added and tested with an equivalent view fixture. Prisma recovery marked the failed attempt rolled back, then the corrected migration applied. All 87 migrations are applied; metadata confirms 69 triggers on ordinary tables and none on views.
- Live public checks passed: homepage, login, shallow health, robots, sitemap index, mobile capabilities, logout cache-clearing header, and realtime invalid-session rejection. All 48 native mobile backend routes were reached.
- Live browser check at 1280px: login headline fits one line without overflow; zero observed console errors. Isolated layout checks also passed at 1024, 1440 and 1920px. This is not authenticated accessibility QA.
- Reported VS Code `workflowSubmission` errors were not reproduced by TypeScript. Prisma Client was regenerated; the generated delegate is present. An editor retaining old diagnostics may need TypeScript Server restart.

No signed-in production mutation, real provider transaction or store submission was performed. Authenticated realtime and device workflows still need their smoke tests.
