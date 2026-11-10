# Collections today and guided portfolio setup

## Daily collection workspace

Open **Collections today** from organization navigation (`/dashboard/org/collections`). The workspace requires an active organization-wide admin, manager, office or accountant membership, collection/payment permission and an accessible subscription. Staff scoped to a property, building or unit do not receive organization-wide customer balances.

The paginated queue groups overdue rent by tenant, across active and terminated non-deleted leases and non-archived tenants. Units and properties must be retained. Rent due today, water, deposits and waived charges are excluded from overdue rent. Search by tenant name and filter all accounts, contact due today/earlier, assigned to me, needs an owner, missed promises, or payment review. Each page contains 25 accounts; totals are computed across all eligible accounts, not just the visible page.

Existing open payment promises contribute their owner and follow-up date when no separate collection task exists. Assign a current authorized colleague and a next-contact date, add contact notes, reschedule an existing task or mark it contacted. Collection follow-ups use tenant CRM tasks with the subject `Rent collection follow-up`, so shared history and staffing coverage keep using established records. Reassignment updates the current task and logs a change rather than reporting a contact as completed. Submission keys prevent duplicate assignment/reminder requests from creating duplicate records. The existing payment-promise workspace remains available at `?view=promises`; it enforces allocated-payment progress before fulfilment and due-date checks before recording broken promises.

The rent statement link shows paginated rent charges, allocated amounts and remaining balances for that tenant, with organization ownership checked on the server. The separate payment-record link is shown only to roles that can open tenant records. Payment verification and reconciliation continue through the established payment workspace; collection actions do not invent payments or reconcile transactions.

## Review payments before reminding

Tenant-linked pending rent payments, disputes, successful unapplied payments and successful unreconciled payments are flagged for review. Payments linked through a rent charge are attributed to its tenant even without a payer-tenant field. Unidentified rent payments are flagged separately for manual matching. An unconfirmed M-Pesa STK attempt alone is not treated as proof of payment; a successful callback or a manual pending proof is reviewed. A flagged tenant cannot have a reminder approved from this workspace until the issue is resolved.

Open **Preview & approve rent reminder** to see the exact amount, recipient choices and dated message. Explicit approval is required. The server recomputes the balance/contact snapshot at submission and refuses stale previews, paid-up accounts, cross-organization records and duplicate queued/sent reminders on the same channel in one Nairobi day.

Portal reminders are stored immediately in the tenant's notifications. Email reminders are queued through the existing notification dispatcher and require its normal provider credentials and scheduler. Queued, sent, failed and portal-read states remain distinct. A sent email status does not prove receipt or reading. No external messages are sent merely by opening the workspace, saving a follow-up or implementing this feature. Existing independent automated notification workflows retain their existing behavior.

## Collection results

Today/month totals use rent allocations attached to successful verified or verification-exempt payments, by payment date in Nairobi, excluding reversals and future-dated payments. Water, deposits and unapplied cash are excluded. These are payment-date collection figures, not an accounting profit or the current month's charge collection rate. The page also shows promises explicitly recorded fulfilled this month; open promises can show derived fulfilled/broken progress until an outcome is recorded.

## Guided onboarding and imports

**Guided setup** (`/dashboard/org/setup`) links actual portfolio counts to properties/units, tenant/lease, first-bill and team-access steps. It remains available after the first bill. An occupied unit is never suggested for a new tenancy. Only distinct active internal staff and unexpired pending staff invitations count toward team readiness; tenant logins and historical invitations alone do not count as teammates.

For existing spreadsheets, export CSV and import in this order: properties → units → tenants. Imports create records and optional leases/initial charges, not tenant login credentials. Setup links imported tenants to their existing records for access review rather than inviting another duplicate tenant creation.

CSV imports require organization-wide access, appropriate dataset permissions and lease-management access when allocating units. The maximum is 500 data rows and 512 KB; larger files are rejected in full rather than truncated. Malformed quotes, duplicate/empty headers, extra row values, duplicate records, missing properties/units and unavailable unit assignments are rejected. Unit imports begin as vacant; tenant imports establish occupancy. Required consent is not assumed from an uploaded record.

A successful preview issues a signed token bound to the exact organization, user, dataset and CSV, valid for 15 minutes. Committing requires that token and a separate confirmation. Editing the CSV or dataset disables the commit control and requires a valid preview for that exact input. Related records and quotas are checked again in the transaction, and imports roll back as a unit if a record has changed or a write fails. If records commit but history storage fails, the response explicitly reports that the records were created so the operator does not unknowingly repeat the import.

## Native and release scope

Native organization navigation includes Collections today, native queue filters, account cards, owner/date/note assignment, completion, payment-promise creation/outcomes and reminder preview/approval. It uses the same scoped services and requires the existing `X-EstateDesk-Forms: 2026-11-09` header. Guided spreadsheet upload/setup and the detailed rent statement are web/mobile-browser workspaces; native cards include their relevant balances and promise/payment-review summaries.

No new schema migration or provider credential is introduced by this feature. The prior CRM and organization-management migrations must already be applied. Publish the matching backend and rebuild the native application for its new filters. The existing notification dispatcher must be configured before email reminders can be delivered.

Validation covers targeted CSV/policy/preview-token tests, disposable PostgreSQL collection/import scenarios, narrow-screen browser fixtures and signed-in native API/mobile-web scenarios. These checks do not constitute installed iOS/Android device acceptance, a full-system mobile audit or production deployment.
