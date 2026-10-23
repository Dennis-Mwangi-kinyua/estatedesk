# iOS and Android release verification — 22 October 2026

Scope: the current working tree, including pre-existing uncommitted changes. Backend deployment does not distribute a new installed mobile binary.

## Verified

- Web and mobile TypeScript checks passed.
- All 643 unit/presentation tests passed after correcting a report fixture that created records at the exclusive report cutoff.
- Both iOS and Android Hermes bundles exported successfully for workflow protocol 1.
- Android native debug compilation passed (`:app:assembleDebug`, 347 tasks).
- iOS Release simulator compilation passed. An unsigned simulator build could not access SecureStore; rebuilding with local ad-hoc signing resolved the entitlement error. The signed app renders the sign-in screen on iPhone 13 mini. Android renders its sign-in screen on the API 37 emulator through a development build. These are launch checks, not signed-in device workflow sign-off.
- All eight signed-in native API scenarios passed on disposable local accounts: transport/ownership, session setup/logout, manual payments/meter approval, receipt scope, photo evidence and retry deduplication, visitor admission/revocation, community, expenditures and profile. The production-mode test server uses an explicit disposable signing secret and a provider-free build for local photo storage. No customer financial/legal records were used.
- Session creation now propagates cookie-write failures instead of silently ignoring them; native login rereads the cookie store after the shared sign-in action. The full 643-test regression suite passed again afterward.
- All 48 mobile API handlers are present in the web production artifact.
- All 88 production database migrations now match source. An older payment migration had reversal SQL appended after application. Its original bytes/checksum were restored and the additions moved to `20261022150000_reconcile_payment_reversal_history`. The new migration passed on a fresh database and twice against both original and expanded payment schemas, preserving existing payment/reversal data and foreign-key behavior.
- A private pre-repair backup was created and decoded completely with `pg_restore --file=/dev/null`; its SHA-256 checksum is stored beside it. This is local recovery evidence, not off-site backup retention.
- `www.estatedesk.co.ke` was attached to the existing Vercel project. Its external DNS is not configured. Vercel recommends `CNAME www → e0f913cc4aab26ab.vercel-dns-017.com.` at the Cloudoon DNS provider.

## Production deployment

- Final deployment: `dpl_FzshWTL4eo62q9xkcAXrh2HqfNSD` (`estatedesk-bllssq9ga-dennis-mwangis-projects.vercel.app`). Its protected staging endpoint returned workflow protocol 1 before promotion.
- Promoted to the existing production project. Homepage, login, shallow health and mobile capabilities return HTTP 200 at `https://estatedesk.co.ke`.
- Post-promotion verification confirms the live apex points to that exact deployment, both artifact source fingerprints match, all 88 applied migration checksums match, and 48/48 mobile routes are reachable. This read-only live check does not validate signed-in production mutations.
- Rollback target recorded before promotion: `dpl_421aMiM2SctJN5Ji7XH1dyEz7mrB` (`estatedesk-iea7tc8a6-dennis-mwangis-projects.vercel.app`).
- The `www` hostname remains unresolved (`ENOTFOUND`) until its Cloudoon CNAME is added. The app keeps its reachable apex API origin until DNS is ready.
- Launch screenshots: [iOS](native-release-ios.png), [Android](native-release-android.png). The Android screenshot includes the development-client control and a sign-in-again notice; these are not store listing screenshots.

## External requirements still outstanding

- Expo CLI is not logged in and `EXPO_PROJECT_ID` is absent. Signed EAS builds, APNs/FCM provisioning and store distribution require the organization's account/project setup.
- No Android physical device is connected. Simulator/browser checks do not establish physical-device cookie transport, permissions, push delivery, accessibility or performance.
- No native crash-reporting project is configured. A reporting project/DSN is needed before that integration can be completed and verified.
- Store listings, disclosures, reviewer access and account-deletion handling need completion against the actual store accounts and product policy.
- Full action parity remains an explicit audit item. Native source already contains drawn/uploaded signatures, inspection photos, booking actions and vault tools; old README statements describing these as absent have been corrected. Presence of handlers does not prove every role/action variant is complete.

Do not interpret this record as store submission, full device sign-off or complete role parity.
