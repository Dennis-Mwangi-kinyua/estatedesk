# EstateDesk mobile

Native Android and iOS app built with Expo and React Native. Includes secure login/logout, first-login password and terms setup, organization switching, tenant bills, partial M-Pesa STK/manual payment submission and history, tenant maintenance requests, caretaker meter submissions, personal notifications, tenant lease/history and move-out progress, caretaker maintenance work orders, and a scoped staff unit directory. Other organization workflows continue on the website. Native push registration and delivery are implemented behind `NATIVE_PUSH_ENABLED`; Expo/APNs/FCM configuration and physical-device validation remain release requirements.

## Local development

Use Node.js 24.3+ on the 24 LTS line; the Expo 58 / React Native 0.88 toolchain does not support Node 20. From the repository root:

```sh
npm install
cp apps/mobile/.env.example apps/mobile/.env
npm run dev
```

Set `EXPO_PUBLIC_API_URL` to the backend origin you want to test against. The backend must include the new `/api/mobile/*` routes. For a physical phone, `localhost` refers to the phone: use your Mac's LAN IP and ensure both devices can reach the server. HTTP is allowed only in JavaScript development mode; prefer an HTTPS development tunnel, as native transport settings can also restrict HTTP. Never put database credentials, signing secrets, or private API keys in `EXPO_PUBLIC_*` variables.

For local native builds, install Xcode and its command-line tools for iOS, or Android Studio with its SDK and an emulator for Android. Then run:

```sh
npm run mobile:ios
# or
npm run mobile:android
```

These commands compile a development build and start Metro. On later runs, use `npm run mobile:start`. This project targets native mobile; a browser preview is not supported by its session storage/API policy.

## Cloud builds

Create your own Expo account, then from `apps/mobile`:

```sh
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
```

Link to your organization's Expo project. If EAS cannot write the dynamic app config automatically, put the generated project ID in `EXPO_PROJECT_ID` (locally and in the EAS environment). Set `EXPO_PUBLIC_API_URL` in the appropriate EAS environments too; local `.env` files are ignored by Git and are not a release configuration. Physical iOS development builds need Apple provisioning; Android internal builds do not require a Play account.

`eas.json` includes development, preview, and production build profiles. Bundle identifiers default to `ke.co.estatedesk.mobile`; confirm ownership/availability before first distribution. Replace development branding with final store icons and splash assets before release. No Expo project, credentials, or store records have been created by this change.

## Backend and sessions

- `POST /api/mobile/login`: JSON email/username and password; reuses web login validation, rate limiting, account checks, and session limits. Returns only a newly issued signed session cookie.
- `GET /api/mobile/session`: validates the existing session and applicable organization/maintenance checks; returns a minimal profile.
- `GET /api/mobile/tenant/bills`: checks tenant role, organization membership, an active lease, password/terms setup, and derives tenant scope from the session. Reuses the website's invoice queries and returns display fields only.
- `POST /api/mobile/logout`: revokes the server session before clearing local credentials. Offline revocation failures remain retryable.

The native app stores the signed cookie in Expo SecureStore and explicitly sends it in the `Cookie` header. It never saves the password. Requests require `X-EstateDesk-Client: native` and reject browser Origin/Fetch Metadata headers; no CORS access is enabled. The client header is not authentication. Existing session expiry, revocation, account status, and device limits apply. Native cookie transport must be verified on real iOS and Android development builds before release.

Accounts requiring a password change or terms acceptance complete setup in the app. Organization switching lists only active memberships owned by the signed-in user and clears the previous workspace data. Opening the website does not transfer the mobile session; users sign in there separately.

## Validation and release

```sh
npm run mobile:typecheck
npm run check -w @estatedesk/mobile
node --import tsx --test tests/unit/mobile-api.test.ts tests/unit/session-cookies.test.ts tests/unit/login-password.test.ts
```

Before distribution, test real accounts against a staging database: valid/invalid login, rate limiting, password/terms gates, disabled users/orgs, maintenance mode, session revocation/expiry, cross-tenant access, empty bills, currency formatting, offline retries, restart persistence, and logout on both devices. Store release also needs Apple/Google developer accounts, final assets, privacy/data disclosures, reviewer access, account deletion where applicable, and review of any payment flows added later. The implementation is not a completed store submission. Native issue attachments, meter photos, and offline submission queues remain outside this mobile release; use the website for photos and reconnect before submitting.


## Native workflow APIs

All endpoints require the native request boundary and a live session. Mutations use bounded JSON and a per-user, per-route rate limit. Setup gates and organization role policies apply before resource access.

| Endpoint | Purpose |
| --- | --- |
| `GET/POST /api/mobile/memberships` | List owned active memberships / switch using `membershipId` |
| `POST /api/mobile/account/setup` | Reuse the web password/terms workflow |
| `GET/POST /api/mobile/tenant/issues` | Own reported issues / create for an active leased unit |
| `GET/POST /api/mobile/tenant/payments` | Enabled M-Pesa/manual methods and instructions / submit payment |
| `GET /api/mobile/tenant/payments/history` | Current tenant payment status; check before retrying an uncertain STK request |
| `GET/POST /api/mobile/caretaker/meters` | Assigned pending meters / submit reading for approval |
| `GET/POST /api/mobile/notifications` | Own in-app feed / acknowledge owned notification |
| `GET /api/mobile/tenant/leases` | Current and historical leases owned by the signed-in tenant |
| `GET /api/mobile/tenant/move-outs` | Own move-out statuses and scheduled inspections |
| `GET/POST /api/mobile/caretaker/issues` | Scoped work orders / start, add progress, submit a completion report |
| `GET /api/mobile/org/units?q=&status=&page=` | Searchable, paginated inventory for admins, managers and office staff |
| `POST/DELETE /api/mobile/push` | Register / disable device push for the current login |

Manual payments remain pending until organization verification. STK submission does not prove payment: the existing signed callback settles it. No real provider requests are required by the automated API tests.

## Push operations

Apply `20261017140000_native_push`, configure the Expo project ID for builds, and provision APNs/FCM credentials through your Expo account. Enable Expo push access-token security and set the server-only `EXPO_ACCESS_TOKEN`; set `NATIVE_PUSH_ENABLED=true` only after device testing. Users opt in under Notifications. The existing platform Notifications job dispatches native messages; notification delivery has no automatic schedule; the separate tenant-credit job remains scheduled. Run it regularly and again at least 15 minutes later for receipt reconciliation. See [Expo delivery and receipt documentation](https://docs.expo.dev/push-notifications/sending-notifications/).

Device registrations belong to a server login: deleting/revoking the session removes them. A device only receives notifications for its currently active organization and active membership. After switching organization, enable notifications again for that organization. Push messages contain a generic update notice; the app fetches current authorized content on opening. Unique delivery claims prevent overlapping jobs from sending the same update twice. Unknown send outcomes are retained without automatic resend; failed deliveries need operator investigation. Provider receipt success means handoff to APNs/FCM, not confirmed display on a phone.

## Current validation

Both Android and iOS JavaScript/Hermes bundles export successfully. Native code compilation, cookie transport, notification permission flows, token refresh and delivery, VoiceOver/TalkBack, and app-store reviews still require development builds and devices. See [current engineering evidence](../../docs/audits/2026-10-17/README.md).

## Mobile workspace parity

- Tenants can review current and historical leases, contractual rent/deposit amounts, due days, and move-out/inspection progress. Lease signing, downloads, and creating/cancelling move-out notices still use the website. Contractual deposits are labelled separately from actual money held.
- Caretakers can see work assigned directly to them or within their assigned units, start eligible work, save progress notes, and submit text completion reports. Reports reuse the web approval workflow and remain pending office review; submitting a report does not close the issue. Photo evidence still uses the website.
- Organization admins, managers, and office staff can search property/building/unit names, filter occupancy, and browse 25 units per page. Membership property/building/unit scopes and blocked views apply. Inventory edits remain on the website.
- New workspace buttons are advertised by the authenticated session endpoint and hidden when the role or organization policy denies them. Older backend sessions default to no new capabilities.
- Tenant maintenance reports now support low, medium, high, and urgent priorities. Android's hardware back button returns to the mobile home screen from a workflow and is held while a submission runs.

Validation evidence: [mobile workspace expansion](../../docs/audits/2026-10-17/mobile-parity.md).

The corresponding backend routes must be deployed before testing these new screens. TypeScript checks and JavaScript/Hermes exports do not establish native-device validation; the first Android build still depends on SDK/NDK downloads.
