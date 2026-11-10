# Cross-platform readiness — 9 November 2026

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
7. **Desktop packaging:** the desktop application is the installable PWA. There is no signed standalone Windows/macOS/Linux installer project; add one if the distribution requirement extends beyond the PWA.

See [VS Code emulator setup](VS_CODE_EMULATORS.md) and [CRM workflows](CRM.md).

See [Personal Today](TODAY.md) for the new daily workspace, role coverage and provider limitations. It adds one mobile read endpoint; the current source now has 52 mobile API handlers.

See [Security Centre](SECURITY_CENTRE.md) for account protections, UTC throttling, personal history and transport compatibility.
