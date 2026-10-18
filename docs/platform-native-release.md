# Platform and Developer native release — 18 October 2026

## Follow-up: Users and shared native pages

Fixed the shared newest-first query ordering: Prisma requires separate `orderBy`
entries for `createdAt` and `id`. The invalid combined object caused the mobile
Users request and other collection requests to fail before returning records.
The corrected helper is used by 41 queries across platform and organization
pages. A read-only database check returned 14 users after the correction.

Regression coverage now passes captured platform and organization collection
queries through the generated Prisma validator without database access. Native
record detail pages use the same centered 760-point content width as action forms
on tablets. Lists, detail pages, forms, retry handling and navigation retain the
shared native components.

Follow-up release checks: 74 mobile/deployment/navigation tests passed; production
Next.js build passed and includes all 38 mobile API routes; web and mobile
TypeScript checks passed; iOS and Android Hermes bundles exported successfully.
Native collection interaction checks passed again after the tablet adjustment.
The browser interaction tests use native host stand-ins, not physical devices.

There is no authenticated Expo/EAS release account configured in this workspace,
and no OTA update configuration. Backend deployment and pushing mobile source do
not update installed store binaries. Signed-in physical-device verification and
store distribution remain separate release steps.

## Production resolution

Published deployment `dpl_9sn9XEVVXFShczfK2psxvfrdS3Wk` to `https://estatedesk.co.ke` on 18 October 2026. The previous production release lacked ten mobile API handlers, including the shared workspace screen/action handlers; changing or refreshing the app could not restore those server routes.

The local and Vercel production builds passed. The deployment manifest and upload inspection both included all 38 mobile routes, and 15 targeted deployment/API tests passed. After publishing, `npm run mobile:services:check` reached **38/38** routes, up from **28/38** before publishing. The ten previous HTML 404s now return the expected JSON authentication response or method response. This confirms route availability only; signed-in page data, permissions and mutations still require account/device verification.

## Original live incident

A read-only probe against `https://estatedesk.co.ke`, using a deliberately invalid signed-cookie-shaped value and no account credentials, reached 28 of 38 mobile routes. Ten returned HTML 404 after passing the proxy's cookie-shape check:

- `/api/mobile/workspace/screen`
- `/api/mobile/workspace/action`
- `/api/mobile/help`
- `/api/mobile/legal`
- `/api/mobile/security`
- `/api/mobile/tenant/rewards`
- `/api/mobile/tenant/inspections`
- `/api/mobile/tenant/issues/confirm`
- `/api/mobile/tenant/lease-signing`
- `/api/mobile/tenant/lease-signing/[id]/document`

The shared workspace handlers serve ID verification and all platform/developer native pages and actions. Their absence explains the common service-unavailable failure. Anonymous 401 responses alone do not establish route existence because the proxy can return them before routing.

## Native implementation

Every non-home entry in the web Platform Admin and Developer navigation has a native read handler. A regression traverses that navigation and rejects unfinished fallback views. Native Provider Reports and Notification Queue pages expose the web's secondary operational lists without mixing their pagination with provider/job records.

New action adapters reuse existing web transactions and guards for ID verification, agreement lifecycle and typed signing, provider/report moderation, referral commissions and organization role policies. Role-policy revisions and reviewed agreement hashes travel with the native form; the web transactions reject stale data. Caller-provided target identifiers cannot replace the server-resolved record IDs. Approved exports and direct organization CSV archives can be saved/shared as ZIP files. Existing billing, key vault, provisioning, support, control, queue, feature, backup and rate-limit adapters remain in use.

Read data now follows the corresponding web services: global search covers organizations/accounts/tenants/payments/units; reporting shows operational totals and recent payment volume by currency; broadcasts show general communications; readiness uses the web production-readiness report; API exploration shares the web endpoint catalog. Developer Home requests developer-specific metrics.

Full-screen native detail pages retain all returned fields, status and available operations. Native forms include review/confirmation, error recovery and return to the detail page. Back through related workspaces preserves prior list state.

## Verification and release

Run:

```sh
npm run typecheck
npm run mobile:typecheck
node --import tsx --test tests/unit/deployment-includes.test.ts tests/unit/mobile-*.test.ts tests/unit/platform-nav-mode.test.ts tests/unit/platform-mobile-layout.test.ts
ESTATEDESK_BUILD_WITHOUT_DATABASE=true npm run build
npm run mobile:deployment:check
# After publishing the backend:
npm run mobile:services:check
```

The routing probe checks every mobile source handler with GET requests and no real credentials. It cannot validate account permissions or business transactions. A successful build without a database does not establish production schema/configuration readiness.

Publish all mobile backend and shared-contract files together; several are untracked in the working tree and must be included in a Git-based release. The existing production Vercel project must receive the backend release; exporting an app bundle does not publish it. Keep the preceding deployment available for rollback. Release the updated mobile JavaScript through the existing app distribution mechanism.

Before calling this complete device parity, verify with authorized accounts on iOS and Android: pending ID review/consent/linking, agreement review/signature/version conflict/PDF, provider report resolution, role changes/revision conflict, support entry/exit, vault unlock/key creation, invoice/payment/renewal, exports, queue retries and failure recovery. Perform mutation tests with disposable authorized records, not real customer financial/legal records.

Remaining feature variants: native agreement forms use typed signatures; drawing/upload signatures remain web-only. ZIP transport is capped at 27 MB decoded and the existing export row limits. The platform user's read-only profile/permissions restrictions remain intentional and match the web.
