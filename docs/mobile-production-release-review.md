# Mobile backend production release review — 18 October 2026

Status: prepared for review; production has not been changed.

## Observed failure

The iPad simulator screenshot shows EstateDesk's native Services screen with “This service is currently unavailable. Please try again later.” Both the iPad and iPhone Duo report successfully booted. iPad EstateDesk network logs show repeated HTTP 404 responses from production requests. The configured API origin is `https://estatedesk.co.ke`. These findings point to backend route availability or routing, rather than failed simulator startup. Anonymous requests return 401 and do not prove that a signed-in route exists.

Read-only route probes using a deliberately invalid, synthetic session (no account credentials) distinguish the proxy's cookie-shape check from actual authentication: session, bills, profile, community and expenditures return JSON 401, while rewards, tenant inspections, lease-signing and security return HTML 404. This confirms that the four new service handlers are absent from the current live routing. It does not validate authenticated behavior of the existing handlers.

A separate client navigation bug was identified: removing RefreshControl when leaving Home changed the ScrollView child structure and remounted Workflows, resetting its screen. RefreshControl now remains mounted; refreshing and enabled state are conditional. A real-App-shell regression with iOS/Android native host stand-ins verifies that Help and failed Bills requests retain their destination. The directory remains mounted and hidden on secondary screens so returning Home retains summaries. Request failures display the selected service name with Retry and Back controls. Native-device taps still need confirmation; these regression tests do not constitute device UI validation. Loading existing leases no longer fails entirely when the optional signing endpoint is missing; lease records remain available with a signing-unavailable notice.

## Release contents

Publish the current web backend and shared contracts together, including all files under `apps/web/src/app/api/mobile`, `apps/web/src/lib/mobile` and `packages/contracts/src`. Some new files are still untracked in Git; a Git-based deployment must include them in its reviewed release commit.

The native tenant additions require these endpoints:

| Endpoint | Methods | Native feature |
| --- | --- | --- |
| `/api/mobile/security` | GET, POST | Devices, revocation, tenant password changes |
| `/api/mobile/tenant/rewards` | GET, POST | Points, catalog, requests and history |
| `/api/mobile/tenant/inspections` | GET | Inspection details, checklist and report links |
| `/api/mobile/tenant/lease-signing` | GET, POST | Pending signature requests, typed signing and decline |
| `/api/mobile/tenant/lease-signing/[id]/document` | GET | Exact contract PDF and document-view evidence |
| `/api/mobile/tenant/issues/confirm` | POST | Confirm office-approved completion report |
| `/api/mobile/tenant/issues` | GET, POST | Reports and maintenance requests |
| `/api/mobile/tenant/move-outs` | GET, POST | Notice history, submission and withdrawal |

Include existing community, expenditure, profile, billing, payment, document and visitor routes as well. The artifact check discovers all mobile source routes rather than checking only this list.

No Prisma schema or migration changes are part of this mobile change. Existing production migrations and environment configuration still need to match the application. Retain the current session-signing configuration so the backend release does not unnecessarily invalidate device sessions. No native dependency was added by these service screens; existing development binaries can load the updated JavaScript from Metro. Store binaries require their normal release process.

## Validation

Completed locally:

- Production Next.js build passed, including TypeScript and static generation.
- All 34 native mobile routes are present in the generated production manifest.
- All 53 mobile/deployment-inclusion tests passed, including the new screen-retention regression.
- Mobile TypeScript check and `git diff --check` passed after the client error-state fixes.
- No production deployment or signed-in production mutation test was performed.

```sh
node --import tsx --test tests/unit/deployment-includes.test.ts tests/unit/mobile-*.test.ts
ESTATEDESK_BUILD_WITHOUT_DATABASE=true npm run build
npm run mobile:deployment:check
```

The deployment-inclusion test checks that Vercel's ignore rules include mobile source and shared contracts. The artifact check verifies every mobile route against the generated Next.js production manifest and fails if any handler is missing. Its fixed list of required additions also detects omitted source files. Both Vercel build configurations now run this check before a deployment can pass its build. The build flag avoids database-dependent build work; it does not validate production credentials, database connectivity, deployed handlers or signed-in workflows.

Use the project's existing Vercel release pipeline and review the full workspace diff before publishing; this working tree also contains other mobile changes. Keep the previous deployment available for rollback.

## Checks after an approved deployment

1. Confirm the deployment uses the intended release commit and includes new route files. Retest signed-in requests; anonymous 401 responses alone are insufficient.
2. On iPad and iPhone Duo, refresh the native session and open each service. Verify JSON responses for reads and policy-appropriate 403 responses where access is denied, instead of HTML 404 pages.
3. With disposable authorized accounts, check profile/community/expense changes, reward requests, move-out submission/withdrawal, signing/declining and maintenance confirmation. Do not create financial or legal test records in a real tenancy.
4. Check ownership restrictions using a different tenant, blocked sections, inactive-tenancy rules, session revocation, expiry, PDF ownership and retry after a failed request.
5. Watch production API logs. If expected handlers still return 404, inspect the deployed route manifest and proxy/rewrite configuration. If the release causes regressions, restore the previous deployment and review before retrying.

Full native organization/platform parity, drawn/uploaded native signatures and complete device validation remain outstanding; this backend release does not establish those claims.

## Xcode device inventory

Twenty-two additional iPhone simulators were created and verified: 17 Pro/Pro Max; the 16 family; the 15 family; the 14 family; SE (3rd generation); the 13 family including mini; and 12 Pro/Pro Max. Existing 18 Pro/Pro Max, 17/17e/Air, Duo and iPad simulators were retained. A later simulator creation request was declined, so the remaining older devices were not added. No new runtime was downloaded and no existing simulator was erased.
