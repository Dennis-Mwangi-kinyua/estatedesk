# EstateDesk mobile

Production service availability and release verification: [mobile backend release review](../../docs/mobile-production-release-review.md). After building the web backend, run `npm run mobile:deployment:check` from the repository root. Both Vercel configurations run this route-manifest check to reject a deployment missing native service handlers. Simulator device creation does not deploy backend services.

## Native tenant expansion (2026-10-18)

The tenant service directory now routes rewards, security, inspections and move-out entry points to React Native screens. It no longer offers the full web workspace or falls back to a web page when a native capability is unavailable. Organization and platform tools open native workflows or native record browsers. Full native parity across all roles remains unfinished.

Native sign-in now includes password recovery on iOS and Android. Reset requests reuse the website's email/IP rate limits and return the same confirmation whether or not an account exists. Reset completion reuses the website's one-time token, expiry, password hashing, token invalidation, and security alert. Users can paste the emailed reset link directly into the native form; token values are not saved on the device.

Landlords now have a dedicated native home with portfolio overview, owner statement and payout records, help, and security destinations. Landlord reads resolve the signed-in user's active profile and scope ledger entries to that profile. BnB listing records expose native pause, publish and archive actions backed by the existing audited organization action. Native booking creation/editing, availability settings, check-in/out, cancellation and guest-access actions are implemented. Listing creation/editing and listing photo upload still need native coverage review.

New native workflows include reward balances/catalog/requests/history; password changes and device-session revocation; paginated tenant inspections with checklist details and PDF sharing; move-out submission and withdrawal; typed lease signatures and declining a signature request; and confirmation of office-approved maintenance completion reports. Signing downloads the envelope's exact source PDF, checks its SHA-256 hash and records document access. The signing form requires opening the contract and accepting the envelope's consent text. The native signature field supports typed, drawn and uploaded signatures. Tenant inspection detail includes authorized evidence-photo viewing. These implementations still require signed-in device verification.

Deploy `/api/mobile/security`, `/api/mobile/tenant/{rewards,inspections,lease-signing}`, `/api/mobile/tenant/lease-signing/[id]/document`, `/api/mobile/tenant/issues/confirm`, and the updated issues/move-outs endpoints alongside the app. These routes retain server-side role, ownership, organization, section and active-lease checks and reuse existing mutation logic. Signing and other mutations are never automatically retried. Older backends cannot serve the new screens. Device checks, signed-in API checks and visual validation on iOS/Android remain necessary; source checks do not establish full feature parity or store readiness.

## Shared mobile presentation

Android and iOS use the same bundled colored Feather icons for native tenant cards and navigation. Tenant grids use measured equal-width columns with 12-point gutters, aligned rows, content-aware heights and full-card press feedback. Larger text reduces the number of columns. Management uses native cards with the website’s authorized navigation structure.

## Phone and iPad page structure

Dashboard content uses a centered maximum width of 1,100 points; secondary workflows use a 760-point reading width with adaptive page margins. Forms and lists share card borders, padding, typography and input backgrounds. Profile groups contact details and next of kin into separate cards, with paired fields on wider tablets and stacked fields on phones or with larger text. The tenant tab bar remains centered at a readable width on iPad. Secondary screens use a compact Back toolbar; tenant sign-out is available under Account. iOS native form fields include a Done accessory to dismiss phone and numeric keyboards.

## Mobile-first card layout and recovery

Shared grids use two columns on phone content widths of at least 260 points at standard text sizes, three on tablet widths from 680 points, and four from 960 points. System text above 1.35 scale uses a single column. Pixel rounding keeps complete rows inside the measured width. Dashboard cards grow with text and use full-card tap targets, colored Feather icons and consistent gutters. The tenant welcome actions form a compact group; management tools end with recent activity; caretaker summary cards now open their matching native workflows.

A root render-error boundary can reopen the native workspace without deleting saved credentials or field drafts. It does not recover native-process crashes or preserve unsaved form state. HTTP parsing retains authorization status even when a proxy returns HTML; unexpected HTML becomes a recoverable request error. Native crash reporting, device performance profiling, and signed-in workflow testing still remain release checks.

## Native community, expenditures and profile

Community notices, notice acknowledgement, personal expenditure entry/history, and contact/next-of-kin editing now use native screens. Deploy `GET/POST /api/mobile/tenant/{community,expenditures,profile}` with this client. Reads are scoped to the signed-in tenant and organization; mutations reuse the web actions. Web section policies and active-lease restrictions apply explicitly at API entry points. Expense lists use 25-row pages, validate real calendar dates and currency precision, and ask for confirmation before recording. No mutations are automatically retried.

Validation: mobile and web TypeScript checks, 42 mobile/presentation unit tests, and both platform bundle exports pass. A disposable-account Playwright scenario covers notice ownership, expense ownership and native transport restrictions; it requires `ROLE_WORKSPACE_FIXTURE` and has not been executed without that fixture. Signed-in device checks and deployment of the new routes remain required.

## Native tenant navigation and responsiveness

Both platforms now route payments, water bills, invoices, leases, payment/tenancy history, move-out progress, documents, visitors, notifications, Account and Help to native screens when their capabilities are advertised. Account shows the current session details and links to native account tools; contact and next-of-kin editing use the native Profile screen; password/security settings use the native Security screen. The invoice screen lists bill periods and shares authorized PDFs using the native share sheet.

Opening a workflow changes screens immediately and shows loading/retry states while data arrives. Returning Home retains the dashboard and its search/summary state. Hidden tenant dashboards suspend foreground-resume refresh, and grids retain their last positive measured width during layout transitions. The root ScrollView always retains its RefreshControl; only its refreshing/enabled state changes. Removing that control when leaving Home remounted the native content tree and reset the selected workflow, causing service cards to appear inactive. A regression test exercises the real app shell with the installed iOS/Android ScrollView structures and verifies that both local Help and a failed Bills request retain their destination. Manual refresh remains available. These are source improvements; smoothness still needs device profiling.

All active screens render natively. Full management action parity remains incomplete; see the native record-browser limitations below.

## Native navigation and management screens

The app renders React Native screens throughout. The old WebView component has been removed. Sign-in help, mandatory terms and privacy reading, tenant help, field tools and management records remain inside the app. Terms and privacy use the same source text as the website. Existing portal endpoints remain server-side for older installed clients.

Tenant tabs retain Home, Services, Activity and Account. Caretaker and gate workspaces use measured responsive cards with colored, tinted icon tiles. Dashboard and native record screens use a 1,100-point maximum width; focused forms use a 760-point reading width. All tool cards wrap for larger text. Android Back returns to Home and all workflows retain a native Back toolbar.

Management tools use `GET /api/mobile/workspace/screen?kind=organization|platform&path=<exact-authorized-menu-path>&q=<search>&page=1`. Records use explicit field allowlists, 25-row pages with one lookahead row, search, status badges and expandable details. Authorization checks the live workspace, exact authorized menu entry, role/view policy and organization membership. Portfolio records additionally retain property/building/unit scope; views that cannot safely represent a narrow assignment require organization-wide access. Unknown scope types fail closed. API vault locking remains enforced and hashes/credentials/private payloads are excluded.

Native record browsing covers organization properties, buildings, tenants, leases, charges, water bills, payments, maintenance, inspections, move-outs, vacancy inquiries, staff, community notices, chart of accounts, requests, expenditures, taxes, imports, reports, short stays, profile, settings, support messages, service jobs, identity requests and agreements. Platform browsers cover organizations, users/operators, subscriptions, payments, expenditure records, audit/security events, scheduled job runs, messages, onboarding, marketers, export requests, reports, permissions, feature configuration, service providers, integration readiness, configuration presence and backup/control snapshots. Search and insights currently provide limited organization/unit lookup. Support-access browsing does not grant a support session. Controls, creation, editing, approval, exporting and signing are not implied by the ability to browse a record.

Deploy the new `/api/mobile/workspace/screen`, `/api/mobile/help` and `/api/mobile/legal` routes with this app. Account setup can read legal documents before completion; Help only returns guide articles allowed for the current role. API vault unlock and key management use native action forms. Each read supports error recovery; mutations are never automatically retried.

Full action parity remains unfinished: the new management record screens do not yet implement every web creation/editing/approval workflow. Existing native tenant, payment review, gate and field mutations remain available. Drawn/uploaded signatures and inspection evidence viewing are implemented; device validation remains necessary. Test signed-in iOS and Android devices before release; bundle exports do not prove crash freedom or visual parity.

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

`eas.json` includes development, preview, and production build profiles. Bundle identifiers default to `ke.co.estatedesk.mobile`; confirm ownership/availability before first distribution. The app icon and teal native splash reuse the existing EstateDesk house artwork in `assets/`. The `expo-splash-screen` plugin applies the splash on both platforms during prebuild. Rebuild the native app to see these changes. No Expo project, credentials, or store records have been created by this change.

The release-signing plugin prevents prebuild from assigning the public debug key to release builds. EAS supplies managed signing credentials; local Android release signing uses `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_STORE_PASSWORD`, `MYAPP_UPLOAD_KEY_ALIAS` and `MYAPP_UPLOAD_KEY_PASSWORD` Gradle properties. Keep credentials outside source control.

## Backend and sessions

- `POST /api/mobile/login`: JSON email/username and password; reuses web login validation, rate limiting, account checks, and session limits. Returns only a newly issued signed session cookie.
- `GET /api/mobile/session`: validates the existing session and applicable organization/maintenance checks; returns a minimal profile.
- `GET /api/mobile/tenant/bills`: checks tenant role, organization membership, an active lease, password/terms setup, and derives tenant scope from the session. Reuses the website's invoice queries and returns display fields only.
- `POST /api/mobile/logout`: revokes the server session before clearing local credentials. Offline revocation failures remain retryable.

The native app stores the signed cookie in Expo SecureStore and explicitly sends it in the `Cookie` header. It never saves the password. Requests require `X-EstateDesk-Client: native` and reject browser Origin/Fetch Metadata headers; no CORS access is enabled. The client header is not authentication. Existing session expiry, revocation, account status, and device limits apply. Native cookie transport must be verified on real iOS and Android development builds before release.

Accounts requiring a password change or terms acceptance complete setup in the app. Organization switching lists only active memberships owned by the signed-in user and clears the previous workspace data. No mobile workflow opens the website for account setup or help.

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
| `POST /api/mobile/account/recovery` | Anonymous, rate-limited reset-link request and one-time password reset using the website's token and security-alert workflow |
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

- Tenants can review current and historical leases, contractual rent/deposit amounts, due days, and move-out/inspection progress in native quick screens. Typed lease signing and creating/withdrawing move-out notices use native screens. Available lease PDFs can be viewed and shared in the app. Contractual deposits are labelled separately from actual money held.
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

## Native platform and developer workspaces

User accounts opens responsive organization cards with live user counts, followed by user cards for the selected organization. Accounts with multiple active memberships appear in each organization; those without a live organization appear under No organization. Tapping a user opens their identity details, including their user ID, registered national ID when available, contact details and memberships. Identity details are fetched for that user within the selected organization; returning preserves the organization and current user page. Grouping happens on the server before pagination. Search matches organizations or people at the group level and people within the selected organization. Deploy the updated workspace screen endpoint with this client; organization filtering never replaces the platform-role and account-setup checks.

Jobs & Queues and the notification queue use responsive native card grids on iOS and Android. Each card shows its status and up to six operational fields, including run times and processed/success/failure counts, or notification organization, channel and message preview. Status filters, pagination, full details and authorized retry actions remain available. Larger system text switches the grid to a single column.

Both workspaces use native collection pages, full-screen record pages, searchable lists, status filters, pagination and native action forms. Back navigation retains the previous workspace's search and page state. No platform operation is rendered in a WebView.

Platform operations include organization/owner creation, role-access policies, billing invoices/payments/renewals/cancellation, ID verification requests/review/linking, service agreement draft/revision/send/cancellation/reminders/typed signing/PDF download, provider moderation/report resolution, referral attribution, onboarding, messages, expenditures and operator provisioning. Developer operations include API vault/key management, feature flags, job/notification retries, rate-limit resets, export approval/rejection/ZIP download, backup evidence and the existing super-admin website controls. Read-only account and permissions views preserve the web restrictions.

Platform Reports uses grouped native cards for workspace coverage, billing and payments, and operations and delivery. Cards show headline totals and status breakdowns, open their complete details, and adapt to phone/tablet widths and larger text. Payment activity is explicitly limited to the latest 500 payments; verified volume excludes reversals, failed and unverified payments, and remains separate by currency. Global search covers the web's five resource types. API exploration uses the shared web endpoint catalog; system health uses the web readiness service. Developer Home loads its own queue/key/export/job metrics. Provider reports and notification queues have dedicated native pages.

## Release and validation limits

The backend must be deployed with every mobile route before the installed app can use these services. A live route audit on 18 October found 10 missing routes, including the shared workspace screen/action handlers. Editing or bundling native JavaScript does not publish these handlers.

Run `npm run mobile:deployment:check` after a production build and `npm run mobile:services:check` after deployment. The live check uses no account credentials and does not validate authenticated workflows. See [platform native release evidence](../../docs/platform-native-release.md).

The shared native signature field supports typed, drawn and uploaded signatures in tenant and management action forms. Verify each signing workflow on devices before release. ZIP exports are limited to 27 MB decoded; the web's export row limits still apply. Local source tests and bundle exports do not establish complete signed-in iOS/Android device validation.
