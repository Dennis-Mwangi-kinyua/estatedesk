# EstateDesk mobile

## Shared mobile presentation

Android and iOS use the same bundled colored Feather icons for native tenant cards and navigation. Tenant grids use measured equal-width columns with 12-point gutters, aligned rows, content-aware heights and full-card press feedback. Larger text reduces the number of columns. Management uses native cards with the website’s authorized navigation structure.

## Native community, expenditures and profile

Community notices, notice acknowledgement, personal expenditure entry/history, and contact/next-of-kin editing now use native screens. Deploy `GET/POST /api/mobile/tenant/{community,expenditures,profile}` with this client. Reads are scoped to the signed-in tenant and organization; mutations reuse the web actions. Web section policies and active-lease restrictions apply explicitly at API entry points. Expense lists use 25-row pages, validate real calendar dates and currency precision, and ask for confirmation before recording. No mutations are automatically retried.

Validation: mobile and web TypeScript checks, 42 mobile/presentation unit tests, and both platform bundle exports pass. A disposable-account Playwright scenario covers notice ownership, expense ownership and native transport restrictions; it requires `ROLE_WORKSPACE_FIXTURE` and has not been executed without that fixture. Signed-in device checks and deployment of the new routes remain required.

## Native tenant navigation and responsiveness

Both platforms now route payments, water bills, invoices, leases, payment/tenancy history, move-out progress, documents, visitors, notifications, Account and Help to native screens when their capabilities are advertised. Account shows the current session details and links to native account tools; contact and next-of-kin editing use the native Profile screen; password/security settings still require their existing web workflows. The invoice screen lists bill periods and shares authorized PDFs using the native share sheet.

Opening a workflow changes screens immediately and shows loading/retry states while data arrives. Returning Home retains the dashboard and its search/summary state. Hidden tenant dashboards suspend foreground-resume refresh, and grids retain their last positive measured width to avoid collapsing while hidden. Manual refresh remains available. These are source improvements; smoothness still needs device profiling.

This is still a partial native migration. RentRewards, tenant inspection details, lease signing, move-out submission/withdrawal, security administration and many platform management actions still open web workflows. They need dedicated native APIs and screens before the apps can be described as fully native.

## iOS startup troubleshooting

An installed development binary without `RNCWebViewModule` can fail before React registers the app and show “App entry not found”. Rebuild with `npm run mobile:ios` after adding native dependencies; Metro reload alone cannot install them. WebView now loads only when an additional web workflow is opened, so this optional integration no longer runs during native app registration. A missing module shows a rebuild message in that workflow.

On 2026-10-18, the iOS simulator build completed and reached the native sign-in screen after rebuilding with the WebView pod. Signed-in pages still require visual validation with a valid account.

## Organization and platform dashboards

Management opens a native React Native dashboard. Organization, Admin and Developer views use responsive card grids, colored icons, feature search and authorized API summaries. Admin and Developer tool lists match the web modes; tests compare their destinations directly. Native unit browsing, payment review and gate workflows are used when available. Additional feature pages still open individually in the authenticated in-app web workspace; these have not all been converted to native screens.

There are no native organization-switch controls. Platform mode changes happen within the native dashboard, without automatically opening a full-screen browser. API role policies continue to authorize every destination.

The native forms include vertical input padding, multiline top alignment and wrapping button rows for iOS larger-text layouts. Workspace modals establish their own safe-area provider, and their toolbars wrap on narrow screens. The tenant keyboard dismisses interactively on iOS.

`/api/mobile/workspace` returns authorized summaries and tools; `/api/mobile/workspace/portal` bootstraps individual web workflows. Deploy the existing backend endpoints and proxy exceptions with the app. Device checks remain necessary for larger text, keyboard behavior, document sharing and authenticated web workflow completion.

## Complete tenant workspace (iOS and Android)

Tenant navigation is designed for phone use: a persistent bottom bar opens **Home**, **Services**, **Activity** and **Account**. Home prioritizes outstanding bills and payment access, large everyday shortcuts, rent/repair summaries and tenancy details. Services contains searchable feature cards. Activity shows recent payments and messages. Account opens the authenticated profile. Switching tabs retains loaded summaries and returns to the top; opening a workflow also resets the scroll position. Signing into another account starts on Home. Android Back returns from Services or Activity to Home before leaving the app.

Pull down on a dashboard tab to refresh the session and reload summaries, or use its refresh button. The bottom bar stays outside scrolling content and hides during keyboard input, setup, offline mode, native workflows and the full-screen web workspace. Buttons are disabled while a native workflow is loading/submitting. Search supports clearing the query and dismissing the keyboard; opening a workflow dismisses it too. Cards open the matching native workflow or web section directly. The layout switches to a single column on narrow screens or with larger system text. Missing summaries show an unavailable state rather than a zero balance. Physical iOS/Android checks for navigation, pull-to-refresh, keyboard handling, safe areas and screen-reader focus remain release requirements.

**Open full workspace**, under Services, opens the responsive web tenant portal inside a full-screen in-app WebView using the current mobile login. The existing native quick workflows remain available. Community notices, RentRewards redemption, expenditures, profile/next-of-kin editing, password and session security, lease signing, move-out submission/withdrawal, maintenance resolution confirmation, inspections, invoice history and statements use the same pages, actions and authorization as the website. This is a hybrid implementation: these additional workflows require a connection and are displayed as web screens inside the app.

Use **All features** in the workspace toolbar for every tenant navigation entry, including account history and help. Active-lease, gate availability and organization policy checks remain enforced by the web pages. The menu itself lists entry points; a listed entry does not grant access. Inactive tenants retain the website's history/profile/security behavior. Closing the workspace refreshes the native session and clears loaded native workflow state, including after profile changes, organization switches and payments.

The `/api/mobile/tenant/portal` bootstrap validates the existing live tenant session and setup gates, then installs its HttpOnly cookie in the in-app browser. Credentials are sent only in the initial request header to the fixed backend endpoint, never in a URL or injected script. It does not create an additional login. Incognito mode, disabled shared/third-party cookies and disabled browser caching keep this separate from the user's system browser. Android clears previous WebView cookies when opening a workspace; iOS uses a nonpersistent data store. External HTTPS, phone and email links open through the device, without forwarding mobile credentials. Other external schemes are blocked. Web logout/session revocation is rechecked when returning to native screens.

Owned lease/invoice/inspection PDFs, receipts, payment statements and move-out reports use the existing authorized download routes and native sharing. Document links are restricted to the configured origin and known routes; downloaded content must be a PDF. No arbitrary webpage can ask the native bridge to fetch a URL with credentials.

Deploy the new bootstrap route and proxy exception together with the app. **A new iOS/Android development build is required** to include `react-native-webview`; a Metro reload alone is insufficient. Run `npx expo prebuild --no-install` from this directory before rebuilding previously generated native projects. Device validation must cover first-open cookie transport, closing/reopening with another account, organization switching, expiry/revocation, web mutations and their error states, lease signature drawing, file selection, PDF sharing, Android back, offline retry, VoiceOver/TalkBack and narrow screens. Source checks and bundle exports do not establish device validation.

Parity and validation evidence: [tenant workspace audit](../../docs/audits/2026-10-18/mobile-tenant-parity.md).

Native Android and iOS app built with Expo and React Native. Includes secure login/logout, first-login password and terms setup, organization switching, tenant bills, partial M-Pesa STK/manual payment submission and history, tenant maintenance requests, caretaker meter submissions, personal notifications, tenant lease/history and move-out progress, caretaker maintenance work orders, and a scoped staff unit directory. Additional organization and platform workflows open in the authenticated in-app web workspace. Native push registration and delivery are implemented behind `NATIVE_PUSH_ENABLED`; Expo/APNs/FCM configuration and physical-device validation remain release requirements.

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

Before distribution, test real accounts against a staging database: valid/invalid login, rate limiting, password/terms gates, disabled users/orgs, maintenance mode, session revocation/expiry, cross-tenant access, empty bills, currency formatting, offline retries, restart persistence, and logout on both devices. Store release also needs Apple/Google developer accounts, final assets, privacy/data disclosures, reviewer access, account deletion where applicable, and review of any payment flows added later. The implementation is not a completed store submission. Native photo evidence and saved meter/inspection drafts are implemented. Camera, QR scanning, PDF preview/sharing and offline restart behavior still require native device validation before release.


## Native workflow APIs

All endpoints require the native request boundary and a live session. Mutations use bounded JSON or bounded multipart photo uploads and a per-user, per-route rate limit. Setup gates and organization role policies apply before resource access.

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

- Tenants can review current and historical leases, contractual rent/deposit amounts, due days, and move-out/inspection progress in native quick screens. Lease signing and creating/cancelling move-out notices are available in the complete in-app tenant workspace. Available lease PDFs can be viewed and shared in the app. Contractual deposits are labelled separately from actual money held.
- Caretakers can see work assigned directly to them or within their assigned units, start eligible work, save progress notes, and submit completion reports with optional photo evidence. Reports reuse the web approval workflow and remain pending office review; submitting a report does not close the issue.
- Organization admins, managers, and office staff can search property/building/unit names, filter occupancy, and browse 25 units per page. Membership property/building/unit scopes and blocked views apply. Inventory edits remain on the website.
- New workspace buttons are advertised by the authenticated session endpoint and hidden when the role or organization policy denies them. Older backend sessions default to no new capabilities. This client sends `X-EstateDesk-Capabilities: 2026-10-18`; the server keeps the original four-feature enum for older installed clients so a backend rollout does not break their session parsing. This header only negotiates display capabilities and grants no permissions.
- Tenant maintenance reports now support low, medium, high, and urgent priorities. Android's hardware back button returns to the mobile home screen from a workflow and is held while a submission runs.

Validation evidence: [mobile workspace expansion](../../docs/audits/2026-10-17/mobile-parity.md).

The corresponding backend routes must be deployed before testing these new screens. TypeScript checks and JavaScript/Hermes exports do not establish native-device validation; the first Android build still depends on SDK/NDK downloads.

## Field work, documents, finance and visitors

- **Documents:** tenants can list verified receipts and available lease PDFs, preview them in the native viewer, and share/save a copy. Each download rechecks tenant ownership, active organization, setup and document/payment/lease view policies. Private app cache is cleared on logout, account changes and organization switches. Copies deliberately shared to another app remain there.
- **Evidence:** camera/library photos attach to maintenance requests, meter readings, caretaker completion reports and inspection condition reports. Images are converted to JPEG and resized to at most 1,600 pixels on their longer side. Native uploads enforce 2MB per image and a 3.7MB streamed request limit, verify file signatures, and reuse the web asset workflows. No broad photo-library or microphone access is needed.
- **Payment review:** staff with `payments.verify` can page through pending manual payments in their membership scope. Every verify/reject requires a note and confirmation. Approval reuses the existing serializable allocation, ledger and receipt flow. Rejection records an audit and notifies the tenant. STK settlement stays with the payment provider. Financial actions are never queued offline.
- **Drafts:** caretakers save meter readings and inspection reports, including a durable copy of evidence. Up to 12 drafts are held in the app's private files and small, device-only SecureStore entries. Drafts are isolated by user, organization and role. A cached profile permits access to saved drafts after an offline restart; it never authorizes server reads or writes. Reconnect to load fresh assignments. Review and sync drafts individually; a failed or uncertain sync retains the draft. A server acknowledgement commits in the same transaction as the reading/report. Replaying the same draft succeeds without repeating the work; reusing an ID with different content fails. Current permissions and assignments are rechecked at sync time. Logout/session revocation removes local drafts. Save work before leaving a form; unsaved input is not automatically persisted.
- **Inspections:** assigned caretakers complete eight explicit checks, a summary, damage/repair notes and optional condition evidence. Sync completes the inspection and advances the move-out notice to inspection completed. Management still controls final handover, refunds and tenancy closeout. Completed reports remain visible in the assigned inspection list.
- **Visitors:** tenants at properties with an active security gate create and share one-use QR invitations, view status and revoke pending passes. QR secrets are shown only when created. Assigned gate staff scan or paste a pass, check visitor details and explicitly confirm admission. Server checks assignment, tenancy, validity, revocation and prior admission again before admitting once. All gate operations require a connection.
- **Dashboard:** role-specific summaries show tenant balance, recent caretaker work/inspections, portfolio vacancies and permitted payment approvals, with direct workflow buttons. Bounded counts are labelled as recent/first-page summaries. Gate/invitation buttons require configured gate access.

New APIs:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/mobile/tenant/documents` | Owned receipts and available lease documents |
| `GET /api/mobile/tenant/documents/{receipt,lease}/[id]` | Authorized PDF download and existing document audit |
| `GET/POST /api/mobile/org/payments` | Scoped pending manual payments / verify or reject |
| `GET/POST /api/mobile/caretaker/inspections` | Assigned reports / submit checklist and evidence |
| `GET/POST /api/mobile/tenant/visitors` | Own visitor passes / create or revoke |
| `POST /api/mobile/gate/visitors` | Check a QR token or admit after confirmation |

This feature set requires a **new native development build** because it adds camera, image picker/manipulator, file system, sharing and crypto modules. Restarting Metro alone does not install native modules. When reusing existing generated `ios/` or `android/` folders, apply the config plugins before rebuilding:

```sh
cd apps/mobile
npx expo prebuild --no-install
cd ../..
npm run mobile:android
# or npm run mobile:ios
```

Deploy the corresponding backend before enabling the new screens. No store binary or production deployment is performed by editing this source.

Device checks: deny/allow camera access, choose a HEIC/library photo, preview/share a PDF on both platforms, save a draft then force-close/reopen offline, retry an uncertain sync, switch accounts/organizations, revoke a session, and scan/admit/revoke/expire a visitor pass. Check VoiceOver/TalkBack and narrow screens. See [implementation and validation evidence](../../docs/audits/2026-10-18/mobile-expansion.md).
