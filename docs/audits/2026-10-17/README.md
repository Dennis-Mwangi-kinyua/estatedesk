# Release readiness — 17 October 2026

This report records checks actually executed against the current working tree. External approvals are not inferred from implemented features.

## Verified

- Web and mobile TypeScript checks passed.
- Web ESLint passed.
- All 493 unit tests passed, with no skips.
- All 78 migrations applied to a fresh disposable local PostgreSQL database.
- All 24 database integration tests passed, with no skips. Coverage includes organization isolation, concurrent settlement, payment allocation and receipts, opening arrears, and native push delivery claims/session revocation.
- Production web build passed, generating 842 static pages.
- Production web dependency audit reported zero vulnerabilities.
- Expo SDK compatibility check passed.
- Local environment readiness reported zero required-setting failures. This checks presence, not deployed provider behavior.
- GitHub production deployment for the previous commit completed successfully. Uptime runs on 17 October succeeded; alert delivery is not configured or verified.
- Earlier disposable recovery evidence is retained in [restore-drill.json](restore-drill.json).

## Release corrections

Platform-admin login now completes its action before full-document navigation, matching ordinary login. Managers can open the agreement detail page as permitted by the agreement service and navigation. Announcement dismissal no longer requests a second client refresh after its server action already revalidates the layout. Browser tests wait for hydrated dialogs, completed submissions, and login navigation.

The fictional-account seed scripts now honor their configured fixture paths. The first browser run exposed a hard-coded path that prevented authenticated tests from loading their accounts. CI now uses Node 24 LTS, matching Expo/native dependency engine requirements. Backup creation now uses a private file-creation mask. Launch documentation now correctly distinguishes the scheduled tenant-credit job from manually operated notification delivery.

## Open gates

- Browser release suite: the first run had 105 passes and exposed fixture, navigation, and product bugs. Sequential checks subsequently passed move-out cancellation/handover/refunds, initial charges/receipts, provider flows, update notices, engineering layouts, and public SEO across applicable desktop/mobile projects. Both admin and manager agreement-signing workflows passed against the production artifact. Final role/account-gate verification is recorded below.
- Production migration: the native push migration was initially pending and has now applied successfully after backup verification.
- Live M-Pesa settlement requires a consenting payer and phone confirmation. Automated callback/settlement coverage does not prove live provider delivery.
- Security alert destination, encrypted off-site backup retention, and recurring production recovery remain unconfigured/unverified.
- No Google Search Console or Bing submission credentials are available locally or as repository Actions secrets. No authenticated submission has been claimed.
- Counsel approval, manual assistive-technology checks, and pilot organization acceptance remain outstanding.
- Mobile audit reports 22 dependency advisories (15 high, 7 moderate) in the Expo/native tooling tree. The suggested forced downgrade is incompatible with this SDK and has not been applied. Native compilation, real-device cookie/push/accessibility checks, signing credentials, and store review remain outstanding. No store release is authorized by passing web checks alone.

Production public smoke audit passed all eight checked routes before deployment. Public liveness returned 200; the attempted deep-health request returned 401, so authenticated deep health remains unverified. A fresh production backup was restored privately in 1 second with a 70-second observed backup age; off-site retention remains open.

Production deployment status and post-deploy smoke results will be recorded after the release action.

## Final production-artifact checks

The final rebuilt artifact passed all 11 authenticated workspace and account-gate browser tests: admin, manager, office, accountant, caretaker, tenant, landlord, security, platform admin, provider, password setup, invitation replay, expired sessions, and expired subscriptions. No tests were skipped in this final run. Typecheck and lint passed after the final product fixes. The final production build passed.
