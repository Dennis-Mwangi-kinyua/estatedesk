## CSV file selection update — 18 November 2026

Native imports now offer a CSV document picker with a 1 MB file limit, a 250,000-character content limit, BOM removal and rejection of binary content. Files still require server validation and explicit import confirmation. Temporary picker copies are deleted after reading. Excel workbooks must first be exported as UTF-8 CSV. This adds a native dependency and requires rebuilding the app; installed-device picker acceptance remains outstanding. See [installable release instructions](INSTALLABLE_RELEASES.md). Earlier dated statements about missing file selection below are historical.

# Cross-platform readiness — 9 November 2026

## Development update — 17 November 2026

Desktop execution follow-up: `npm run desktop:smoke` now launches the source Electron application using a disposable localhost fixture and profile. It passed on the local Linux graphical session, covering renderer isolation, sandbox preferences, notification denial, same-origin navigation, file selection, popup reuse and reload. The cross-platform artifacts workflow now runs this check on Linux (Xvfb), Windows and macOS before packaging. Windows/macOS workflow execution and packaged-binary acceptance remain unverified; this does not establish installed-client or production workflow sign-off.

The repository now includes `apps/desktop`, a sandboxed Electron client for the hosted workspace, with Windows NSIS, macOS DMG and Linux AppImage/Debian packaging targets. Desktop continues to use the web backend and permissions. See [desktop setup and limitations](../apps/desktop/README.md). This adds installer source; it does not certify signed distribution or execution on Windows/macOS.

Native organization collections now link to paginated rent statements. Web and native use the same organization-scoped query, rent-only filters, aggregate totals, stable ordering and 25-row pages. Collection access still requires organization-wide scope and an active subscription at the entry point. Statements omit water, deposits and unapplied cash.

Native imports now support choosing properties/units/tenants, viewing example CSV headers, pasting CSV, validating, reviewing row outcomes and explicitly confirming creation. They reuse the web import action, plan limits, permission checks, 15-minute preview receipt and import history. Editing CSV or changing the record type invalidates the local preview. Server receipts bind the preview to the exact CSV, actor, organization and type. Submission guards prevent repeating a completed operation with the same identifier. CSV and preview tokens stay in memory; there is no native spreadsheet file picker yet. An uncertain commit requires checking history before another attempt.

The manual **Cross-platform artifacts** workflow prepares unsigned desktop review artifacts on Windows/macOS/Linux and exports both native JavaScript bundles. It does not deploy the backend, sign applications or publish to stores. Quality CI also runs the desktop navigation policy tests.

Verified during development: web/native TypeScript checks, focused server lint, Android/iOS Hermes exports, database integration checks for collection isolation and CSV preview behavior, native UI browser-host checks for import confirmation and preview invalidation, and a signed-in local end-to-end scenario covering statements, foreign-organization isolation, native CSV validation/commit, altered-preview rejection and duplicate-submission protection. Browser-host verification does not replace installed-device execution. The patched production web build and artifact-only release checks also pass: both source fingerprints match and all 53 mobile API handlers are present. The signed-in collections/statement/import scenario passes against both development and production-mode local servers; the production fixture uses the hardened secure session cookie. Production database migration history and the deployed backend were not certified by these artifact checks.

Linux review artifacts were generated locally: `apps/desktop/release/EstateDesk-0.2.1-x86_64.AppImage` and `EstateDesk-0.2.1-amd64.deb`. Debian metadata identifies `estatedesk`, version `0.2.1`, architecture `amd64`. The packaged application archive contains only `main.cjs`, `policy.cjs` and package metadata; packaged client code matches the source. These builds have not been launched on a desktop display. Web now resolves Next.js 16.4.6, including the patch for [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h). Web and desktop production dependency audits both reported zero vulnerabilities. This does not claim that the full development dependency tree is advisory-free. The web development command now uses a Node launcher for Windows/macOS/Linux, and its typecheck has an explicit 4 GB heap limit.

Remaining platform work includes signed Windows/macOS builds and execution, Android/iOS device acceptance, native-process crash reporting validation, desktop hardware/push permissions and binary updates, signing/store credentials and store disclosures. The local doctor still reports missing Java, Android platform/build/NDK/CMake tools and a device; an SDK directory exists but does not establish a working toolchain. Linux has no iOS simulator. Existing historical evidence below must not be treated as sign-off for these new changes.

EstateDesk targets desktop/mobile browsers and an installable PWA, plus native iOS and Android through Expo/React Native. The current implementation uses shared backend permissions and business operations; native screens do not embed web pages.

## Implemented in the workspace

| Workflow | Web / desktop PWA | Native iOS / Android |
| --- | --- | --- |
| Personal Security Centre | Password verification, session rotation, device revocation and private history | Same account protections, SecureStore renewal and history |
| Personal Today | Scoped tasks, messages, tenant bills, maintenance and permitted team queues | Same summary with native controls, refresh, filters and read acknowledgement |
| Customer records and history | Organization and platform CRM | Native customer cards, details and paginated history |
| Sales leads and demos | Pipeline, owners, stages, deal values, customer links | Native creation/editing, stage/my-prospect filters, demo scheduling and searchable organization selection |
| Communication | Email and tenant portal messages | Same operations through authorized native forms; provider acceptance remains distinct from confirmed delivery |
| Follow-ups | Assignment, priority, due dates, edit/complete and overdue queues | Native open/overdue/mine/completed views with the same mutations |
| CRM analytics | Periods, cohorts, pipeline currency grouping and customer/subscription status | Native reports use the shared report service and period controls |
| Landlord management | Existing account/property/access workflows | Create accounts, search/paginate organization properties, map properties, reissue setup links and suspend/restore access |
| BnB listings | Existing listing/photo/booking workflows | Create/edit listings, retain/remove photos and add a normalized photo per save, alongside existing booking/access actions |
| Account deletion initiation | Authenticated request/withdraw page and platform review queue | Native account/security panels and platform review forms |
| Render diagnostics | Existing client monitoring | Authenticated, rate-limited render-error fingerprints; no raw error messages, stacks, customer text or image payloads are sent |
| Development tools | Web/PWA launch profiles | VS Code tasks and settings for the installed Diemas Michiels emulator extension, plus `mobile:doctor` |

Deletion requests follow the existing terms: identity, administrator responsibilities and retention must be reviewed. A request does not erase records or disable the login immediately. A reviewer cannot mark closure completed while the login is still active/not deleted. Native render-error fingerprints do not replace native-process crash reporting.

New forms negotiate `X-EstateDesk-Forms: 2026-11-09`. Older installed clients receive an update-required response for the new operations rather than an unsupported form schema. Header negotiation grants no permissions. Existing native transport, role, organization, property/unit scope and account-setup checks remain in effect.

Dates use native numeric calendar/time controls with East Africa Time conversion and invalid-calendar validation. Customer/property selection uses bounded searches. Review summaries omit image payloads, passwords and opaque selected entity identifiers. Photos, signatures, passwords and confirmations are excluded from persisted form drafts.

## Validation evidence

Additional [10 November development verification](audits/2026-11-10/development-cross-platform.md) covers offline recovery fixes, small/tablet screens, large text, secure role sign-ins and broader native API workflows. Forty distinct targeted scenarios passed; actual native-device execution remains unverified.

- Full unit suite: **718 passed**. Focused mobile/PWA/date/form-review checks: **102 passed**.
- CRM/organization/privacy retention integration scenarios: **4 passed** on a disposable local database.
- Signed-in native-client workflow scenario passed against both development and production-mode servers with disposable records; it covers CRM, communication, tasks, role/organization isolation, landlord/property/access management, BnB listing creation/editing, privacy workflows and diagnostics.
- Web/native TypeScript, targeted lint and production web build passed. iOS and Android Hermes bundles exported successfully.
- Both artifact source fingerprints match the final source; **50/50 mobile API handlers** are present.
- The configured database now has **91 matching applied migrations**, including the CRM migration. A private pre-migration backup passed its checksum and full decode before application.

See [release evidence](audits/2026-11-09/cross-platform.md). These are source, bundle, browser-host and backend checks; signed native binary and physical-device sign-off remain external. The matching application artifacts have not been published and no store submission was performed.

The current requested stage is development. Signing, production deployment and store submissions below are future release gates, not prerequisites for ordinary local development.

## External gates still open

1. **Android development toolchain:** Java/SDK/platform-tools and an Android virtual device are still missing on the inspected Linux workstation. A portable, administrator-free Linux x64 installer, SDK package installer, private AVD setup and VS Code tasks are now provided. Download attempts from the coding session timed out, so installation and native execution remain unverified. Run the setup tasks in [VS Code emulator setup](VS_CODE_EMULATORS.md), then `npm run mobile:doctor`. The inspected environment also lacks `/dev/kvm`; a connected authorized Android phone can be used for development.
2. **iOS execution:** this host is Linux. iOS simulator compilation and execution need a Mac with Xcode. The earlier [22 October record](audits/2026-10-22/native-release.md) is historical evidence, not validation of today's source.
3. **Signed distribution:** Expo/EAS project/account access, Apple and Google credentials, signing/provisioning and APNs/FCM need the owner's configuration. Backend deployment does not update installed binaries.
4. **Device acceptance:** complete signed-in iPhone/iPad/Android phone/tablet scenarios, camera/files/permissions, push delivery, logout/revocation, organization switching, large text, keyboard/safe areas, VoiceOver/TalkBack and performance. Validate native-process crash reporting before store release.
5. **Rollout:** the CRM migration is applied and checksums match. Publish the matching backend with target configuration, verify live backend/client protocol and routes, and release the matching native binary. Local test builds must not be mistaken for a production rollout.
6. **Store review:** finalize the actual store listings, screenshots, data disclosures, reviewer access and retention/account-closure process. No store-compliance certification is implied by implementing a request form.
7. **Desktop packaging:** see the 17 November update and `apps/desktop`. Installer source now exists; signed Windows/macOS distribution and execution remain unverified. The installable PWA remains available.

See [VS Code emulator setup](VS_CODE_EMULATORS.md) and [CRM workflows](CRM.md).

See [Personal Today](TODAY.md) for the new daily workspace, role coverage and provider limitations. It adds one mobile read endpoint; the current source now has 52 mobile API handlers.

See [Security Centre](SECURITY_CENTRE.md) for account protections, UTC throttling, personal history and transport compatibility.
