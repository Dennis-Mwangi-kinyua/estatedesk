# Cross-platform implementation and release evidence — 9 November 2026

## Delivered

- Native organization/platform CRM: customer records, sales leads and demos, contact editing, searchable organization selection, messaging/history, follow-up assignment/priority/rescheduling/completion, stage/task filters and shared analytics.
- Native landlord account creation, paginated organization/property selection, property mapping, setup-link recovery and access suspension/restoration.
- Native BnB listing creation/editing, retained-photo selection and bounded normalized photo upload alongside existing reservation workflows.
- Account-deletion request/withdrawal on web and native clients, plus platform review queues/forms. Account-wide privacy requests are kept outside organization purge scope. Completion requires an already disabled, deleted login and retention review.
- Privacy-preserving native render-error fingerprints; native-process crash reporting remains an external release gate.
- Mobile calendar/time controls, validation, selected-state styling, entity searches and safe form-review summaries. Photos/passwords/signatures/confirmations are excluded from saved form drafts.
- VS Code tasks/settings for Diemas Michiels' installed Android iOS Emulator extension and a toolchain checker.
- CRM-aware organization purge planning supports composite relationships and all equally short cascade ownership paths. Shared accounts, unrelated organizations and platform sales history are preserved.

## Verified

| Check | Result |
| --- | --- |
| Full unit regression suite | 718 passed, 0 failed |
| Focused mobile/PWA/date/form-review suite | 102 passed, 0 failed |
| CRM and organization-retention database scenarios | 4 passed on a disposable local database |
| Signed-in native-client workflow scenario | Passed against development and production-mode servers with disposable records |
| Web and native TypeScript | Passed |
| Targeted web ESLint and whitespace checks | Passed |
| Production web/PWA build | Passed; source fingerprint matches |
| iOS and Android Hermes exports | Both passed; source fingerprint matches |
| Mobile API artifact coverage | 50/50 handlers present |
| Configured database migration history | 91 applied migrations match source |

The native-client API scenario covers leads, demos, customer conversion, contact editing, message delivery to the customer portal, task editing/completion, cross-organization denial, older-client form negotiation, landlord/property/access workflows, BnB creation/editing, privacy request/review/withdrawal and diagnostics. Provider email was disabled in tests. Presentation tests use native host stand-ins, not actual devices.

Web source fingerprint: `5f5a6866b4a3bf9e15c30ea66713a9d8747d352350c49ca7d76f09c73a61cf03`

Mobile source fingerprint: `9939b4c57ef00b9c93bfc1509959857679e45ba70110e5e0074ebe47c77fe4c1`

Workflow protocol: `1`. New forms additionally negotiate `X-EstateDesk-Forms: 2026-11-09`.

## Database change

Applied only `20261109120000_platform_and_customer_crm` to the configured EstateDesk database after confirming it was the sole pending migration. The migration adds CRM fields/tables/indexes/constraints and preserves existing onboarding outcomes.

A private pre-migration backup was created at `.private/crossplatform-backups/estatedesk-20261109T131310Z.dump` with owner-only permissions. Its SHA-256 checksum passed and the complete dump was decoded using `pg_restore --file=/dev/null` before applying the migration. This is local recovery evidence; no off-site backup upload or restore into a populated production database was performed.

Initial default connection attempts timed out. An IPv4-first preflight/backup connection succeeded; the migration then completed and the read-only release check confirmed all 91 migration checksums match source. No customer messages were sent as part of this operation.

## Remaining external gates

- No configured Java/Android SDK/adb/virtual device was found on the inspected Linux workstation. Run `npm run mobile:doctor` after installing/configuring the toolchain and accepting SDK licences yourself.
- iOS simulator execution needs macOS and Xcode; this host is Linux.
- Current signed native binaries, physical-device acceptance, signing/provisioning, Expo/EAS project access, APNs/FCM, native-process crash reporting and store listings/disclosures/reviewer access remain required.
- The matching web/backend artifact and native builds have not been published or submitted to stores. A database migration does not deploy the new endpoints or update an installed mobile binary.
- Desktop delivery is the installable PWA; signed standalone Windows/macOS/Linux installers are not part of the current implementation.

[VS Code emulator setup](../../VS_CODE_EMULATORS.md) · [Readiness matrix](../../CROSS_PLATFORM_READINESS.md) · [CRM workflows](../../CRM.md)
