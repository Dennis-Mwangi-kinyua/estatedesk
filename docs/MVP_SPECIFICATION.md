# EstateDesk MVP: Kenyan property operations

Implementation baseline agreed on 14 October 2026. This extends the existing application; it does not replace the established schema or discard financial history. Government identity lookup/verification infrastructure is excluded. Internal permissions, document authenticity checks, payment authentication, and meter-reading approval remain necessary controls.

## Product scope

A Kenya-focused, mobile-responsive PWA for property organisations, landlords, managers, accountants, caretakers, and tenants. Remote owners can use the system from abroad; this does not imply support for every country's payment, currency, or tax rules.

The MVP connects property/tenancy records, utility-first payment allocation, offline water capture, double-entry accounting, public vacancies, and staff-initiated WhatsApp communication. No government identity service, WhatsApp Business API subscription, or new microservice deployment is required for these core workflows. Existing optional integrations remain optional.

## Architecture

| Layer | Implementation |
| --- | --- |
| User interfaces | Existing Next.js PWA; role-specific manager, landlord, accountant, caretaker and tenant surfaces |
| Application | Authenticated server actions and signed payment webhooks; shared billing and accounting services; browser offline queue |
| Persistence | PostgreSQL with Prisma; organisation-scoped records, decimal money values, transactional allocations and journal postings |

The current modular monolith is the deployable MVP. Extracting services or introducing a separate message broker is outside this milestone.

## Normalized entity model

The four blocks in the original brief describe domains, not four literal database tables. Keeping historical tenancy and financial records requires the following separation.

| Domain | Existing records | Purpose |
| --- | --- | --- |
| Organisations and access | Organization, User, Membership, caretaker assignments | Isolate organisations and control role/unit access |
| Owners | LandlordProfile, LandlordAssignment | Map owners to the properties/units they govern |
| Portfolio | Property, Building, Unit | Store physical units, occupancy/listing states, rent and utility settings |
| Occupancy | Tenant, Lease, tenancy history | Preserve move-in/out history; do not overwrite a tenant's historical unit link |
| Utility capture | MeterReading, WaterBill | Keep raw evidence/review separate from issued financial charges |
| Billing | RentCharge, WaterBill and invoice/document projections | Preserve line items, billing periods, rates, amounts paid and balances |
| Payments | Payment, PaymentAllocation, Receipt | Distinguish received money, its allocation, and evidence of settlement |
| Books | AccountingAccount, AccountingJournalEntry, AccountingJournalLine | Enforce double-entry posting and support owner statements/distributions |
| Offline acknowledgements | OfflineSubmission (new) | Record completed client operations atomically so network retries cannot duplicate work |

Balances are derived from charges, verified payments, allocations and journals. A mutable `Tenant.AccountBalance` is not the accounting source of truth. Preserve existing decimal money precision and Nairobi billing dates.

## Onsite utility workflow

1. An authenticated caretaker opens an assigned unit's meter form.
2. The browser validates the reading and saves the draft and photo in account/organisation-scoped IndexedDB before reporting it saved.
3. Reconnection, opening the app online, or manual Sync sends a bounded batch. Background Sync is an enhancement; it cannot guarantee execution with the app closed on every browser.
4. The server rechecks the current session, assignment, unit/lease, period, reading sequence and payload. Cached permissions and client-provided rates are not trusted.
5. Reading plus pending water-bill draft and an acknowledgement are committed together. Rates come from the property, and monetary calculations use decimal arithmetic.
6. A manager reviews the reading through the existing approval workflow. Only an issued/approved bill becomes payable and posts its accrual. A draft may be displayed as pending, but must not inflate collectible balances.
7. The client removes an item only after acknowledgement. Failed/conflicting items remain visible for correction. A retry of the same operation returns its prior result; reuse of its ID with changed content is rejected.

An internal reading review is not government identity verification. It prevents a field typo from becoming a tenant debt.

## Payment reconciliation workflow

1. Tenant pays through a configured M-Pesa or bank channel, or staff imports a statement/records a permitted manual payment.
2. The callback/import is authenticated and matched to the correct organisation and tenancy. Unknown references are retained for review, not guessed.
3. A provider transaction reference cannot create multiple settlements. Callback retries and concurrent delivery are idempotent.
4. Existing combined-bill rules clear service/garbage/security and water before base rent. Deposits, penalties, other fees, designated payments and reversals retain their explicit existing policies; this milestone does not silently reorder them.
5. Partial payment, allocation, receipt snapshot and balanced journal posting commit transactionally. Excess funds stay as identifiable unapplied credit. Reversal uses reversing entries; it does not erase the original history.
6. Staff can prepare a receipt, invoice or balance message and choose to open WhatsApp. Opening a link is not proof that the message was sent or delivered.

MVP bank support consists of configured trusted callbacks (currently including KCB) and statement reconciliation. Additional live bank integrations require that bank's credentials and webhook registration. Owner distributions mean automatic calculation/accounting records and statements; external disbursements must use a separately authorised, configured payment channel.

## Access matrix

| Role | MVP visibility/actions |
| --- | --- |
| Platform administrator | Platform oversight; scoped support access remains audited |
| Organisation manager | Own organisation's portfolio, tenants, bills, staff, approvals and reports |
| Accountant | Granted finance workflows, reconciliation, journals and statements |
| Caretaker | Assigned properties/units and permitted field workflows; no arbitrary finance/admin access |
| Landlord | Assigned portfolio and statements; no other owners' records |
| Tenant | Own tenancy, issued bills, payments, receipts and requests |

Server-side checks apply to every mutation and protected download. Hiding a dashboard button alone is not authorisation.

## Required acceptance evidence

- Offline capture survives reload, stays under the original account, reports storage failure, and retains failed items.
- Replaying one submission creates one reading/bill/issue; changing its payload under the same key is rejected.
- A stale previous reading, invalid period, negative/non-finite value, or out-of-scope unit is rejected without creating charges.
- A reading/bill transaction failure leaves neither half committed and is safe to retry.
- A partial combined payment clears utilities before rent; duplicate callbacks and reversals do not create extra money or receipts.
- Every posted journal balances. Owner statements reconcile to source records.
- Unpublished/non-vacant listings stay out of public discovery. Published pages have canonical metadata and sitemap coverage.
- WhatsApp drafts show the actual recipient, use safe authenticated document links, and do not automatically send messages.
- Desktop/mobile light and dark themes keep fields, labels, service content and actions readable.

## Repository gap map

| Capability | Existing implementation | Work in this milestone |
| --- | --- | --- |
| Property/tenant/lease records | Existing Prisma models and role workspaces | Retain normalized history and permissions |
| Utility-first allocation | `src/lib/ledger.ts`, `src/lib/billing/allocation-priority.ts` | Add/retain acceptance evidence; no allocation-policy migration |
| M-Pesa/bank reconciliation | Signed webhooks, settlement services, statement import | Verify existing adapters; no invented bank connections |
| Offline queue | Queue metadata in localStorage; photos in IndexedDB; online/SW sync hooks | Move queue to scoped IndexedDB; migrate only explicitly recovered legacy drafts; prevent overlapping sync |
| Offline submission | Direct writes; meter duplicates reported as errors; issue retries can duplicate | Add validation, atomic replay acknowledgements and draft-bill parity |
| Double-entry/owner reporting | Existing accounting modules and statement/distribution pages | Retain balanced postings and existing review controls |
| Public vacancy pages | Existing listings, SEO, sitemap and publication controls | Retain and exercise public/private listing cases |
| WhatsApp | Generic recipient links and some operational drafts | Add consistent finance drafts/actions where missing |
| Government identity integrations | Existing optional features outside this baseline | No new dependency or integration in the MVP |

Implementation progress and validation will be recorded with the corresponding feature commits. Financial/schema changes are tested against a disposable database before production migration.
