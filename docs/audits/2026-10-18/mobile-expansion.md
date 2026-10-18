# Native mobile expansion — 18 October 2026

Implemented locally; this change does not publish a production backend or a store binary.

## Delivered

| Area | Native behavior | Server boundary |
| --- | --- | --- |
| Receipts and documents | List, preview, share/save verified receipts and available lease PDFs | Tenant ownership, organization and document/payment/lease view policies; existing PDF hashes and download audit |
| Photo evidence | Camera/library evidence for tenant requests, meters, caretaker completion reports and inspection conditions; resize/convert HEIC to JPEG | Native streamed multipart cap 3.7MB, image cap 2MB, signature validation, existing scoped asset workflows |
| Staff payment review | Paginated pending manual payments, evidence text, explicit verify/reject with a required note | `payments.verify`, blocked views and property/building/unit scope; serializable verification/allocation/receipt and audited rejection; STK excluded |
| Offline field drafts | Save meter/inspection input and photos, review, manually sync, retry uncertain responses | Existing `OfflineSubmission` table; acknowledgement commits with domain changes; identical replay returns success and changed content fails |
| Assigned inspections | Eight explicit checks, summary, repairs, condition photo and completed report history | Current assigned caretaker and scheduled lifecycle checks; inspection/notice transition in one transaction; office retains final handover/refund control |
| Visitors and gate | Tenant creates/shares QR, views status/revokes; gate scans/pastes, checks identity and confirms admission | Existing gate assignments, active tenancy, expiry/revocation and atomic one-use admission; no offline admission |
| Role dashboards | Tenant balance, recent caretaker work/inspections, portfolio vacancies and permitted review counts with quick actions | Existing scoped APIs; bounded counts labelled; capability buttons respect permissions, views and configured gates |

New clients negotiate `X-EstateDesk-Capabilities: 2026-10-18`. Older installed clients receive the original feature enum so deploying the server does not invalidate their session parsing. Negotiation is not authorization. All resource reads and writes independently enforce the live session and domain permissions.

Draft metadata uses small device-only SecureStore entries; evidence copies live in the app's private directory. Drafts are scoped to user, organization and role, with a global maximum of 12. Interrupted saves are registered before writes and recovered on reopening; serialized updates prevent concurrent-save data loss. Cached profile data only enables local draft review during offline restart. It grants no server access. Save before leaving a form; unsaved input is not automatically persisted. Logout/revocation clears local drafts and private evidence/PDF caches. Deliberately shared documents remain in the destination app.

The existing offline acknowledgement migration (`20261014180000_offline_submission_acknowledgements`) is reused; there is no new database schema migration.

## Validation

| Check | Result |
| --- | --- |
| Unit suite | 502 passed |
| Mobile API regression suite | 9 passed on disposable localhost PostgreSQL |
| Final multipart/draft focused checks | 7 passed |
| Mobile TypeScript | Passed |
| iOS and Android Hermes exports | Passed, 827 modules; approximately 2.4MB iOS / 2.5MB Android |
| Native config introspection | Camera description present; microphone description absent; Android backup disabled |
| Expo SDK dependencies | Match the installed SDK's local bundled dependency map; online well-known-version endpoint unavailable in this check |
| Web lint and additional native/contracts/test lint | Passed |
| Production web build and TypeScript | Pending final result |

Reproduction commands (API tests additionally require a safe local `TEST_DATABASE_URL` and fictional `ROLE_WORKSPACE_FIXTURE`):

```sh
npm test
npm run mobile:typecheck
npm run lint
npm run test:e2e -- tests/e2e/mobile-api.spec.ts tests/e2e/mobile-workspaces.spec.ts tests/e2e/mobile-expansion.spec.ts --project=chromium --workers=1
ESTATEDESK_BUILD_WITHOUT_DATABASE=true npm run build
cd apps/mobile
npx expo export --platform all --output-dir /private/tmp/estatedesk-mobile-exports
npx expo config --type introspect --json
```


API tests use an explicitly configured disposable PostgreSQL database on localhost, fictional accounts, and disabled external image uploads. They exercise successful payment verification/allocation/receipt generation, rejection, missing permission, membership scope, private lease PDFs, another account's receipt denial, blocked payment downloads, photo attachments, identical and changed draft replays, unauthorized units/inspections, visitor verification/admission/revocation and duplicate admission. No live payments, real visitor admissions, production data mutations or real notifications are used.

Unit tests include explicit inspection answers/damage notes, mandatory review notes, permission overrides, capability negotiation, bounded multipart bodies, malformed/duplicate fields, draft restart persistence, identity isolation, serialized concurrent saves, keychain failures, interrupted-write cleanup, Unicode chunk boundaries and a full queue.

## Native validation still required

JavaScript/Hermes exports and config inspection are not native-device tests. Rebuild the development client after installing the camera, image picker/manipulator, file-system, sharing and crypto modules. Restarting Metro alone is insufficient.

Test on both iOS and Android: cookie transport and session revocation; camera permission grant/denial; HEIC/library photo conversion; PDF viewing and sharing; force-close/reopen with an offline saved draft; uncertain-response retries; account/organization changes; gate QR scan, expiry, revocation and one-use admission; narrow layouts and VoiceOver/TalkBack. The native toolchain/download setup from earlier work remains separate from these source changes. No store submission was performed.

Implementation guide: [mobile README](../../../apps/mobile/README.md).
