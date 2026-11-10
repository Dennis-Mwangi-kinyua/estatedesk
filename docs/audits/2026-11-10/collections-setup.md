# Collections and guided setup verification — 10 November 2026

The organization collections route now opens a daily tenant account queue. It preserves the existing promise workflow and adds scoped rent statements, staff follow-ups, payment-review flags, current-balance reminder approval, and payment-date rent collection totals. Existing promise owners/dates feed the daily queue when no separate follow-up exists. Native organization cards, filters and actions share the same backend services. Guided web/mobile-browser setup connects real workspace progress to ordered CSV imports and first billing.

CSV commits now require a signed preview for the exact user, organization, dataset and content plus explicit confirmation. Previews expire after 15 minutes. Imports reject oversized files instead of truncating them and validate duplicate records, related records and unit availability before writes and again inside the transaction. Tenant imports do not create portal credentials or assume consent.

## Completed checks

- Web TypeScript and native mobile TypeScript passed for the final source.
- Five targeted unit-test files passed: CSV parsing, preview-token binding/expiry, collection approval/calendar policy, setup/operating workflow policy and workspace authorization.
- Two disposable PostgreSQL scenarios passed: collection totals/reversals, current and missed promise progress, owner retention, assignment replay, reminder approval/freshness/deduplication, payment review (including charge-linked payments and STK attempts), cross-organization/scoped denial; and CSV duplicate/missing/occupied-unit validation, no-write preview, transactional tenant/lease import, replay rejection and full rejection of more than 500 rows.
- Final browser run: **3 passed**, with the duplicated mutating native scenario intentionally skipped in the second browser project. Desktop and mobile fixtures verify follow-up/reminder approval, import-preview gating and widths 320/390/768/1280.
- A signed-in native-client API scenario passed for queue reads, assignment, promise creation/outcome, portal reminder approval and foreign-tenant denial. The same scenario opened the actual web collection workspace at 320px and followed its rent statement link. First-login announcements were marked read on this fictional account so the collection navigation was tested independently of unrelated announcement overlays.
- `git diff --check` passed. Source-file scans found no private configuration, generated artifacts or credential patterns in the outgoing changes.

## Environment and limits

All mutating checks used a disposable local PostgreSQL database and fictional accounts. No configured customer database, external email delivery, production deployment, store submission or installed native-device test was performed. The temporary database server was stopped after verification.

No new migration is required by this feature; prior CRM and organization-management tables must exist. Apply the already pending release migrations before deploying the matching application. Rebuild the native app/backend artifacts from the current source before release; earlier bundle exports do not include this update. Email delivery still requires the existing provider configuration and notification dispatcher. Full-system mobile/device acceptance and the broader release tests remain separate from these focused checks.

See [collections and setup behavior](../../COLLECTIONS.md).
