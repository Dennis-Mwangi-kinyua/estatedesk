# Organization management

These web workspaces extend the existing organization operations. They require an active organization-wide membership and respect role, view, plan, and explicit permission restrictions. Property/building/unit-scoped staff do not gain organization-wide access.

| Workspace | Route | Access |
| --- | --- | --- |
| Approval centre | `/dashboard/org/approvals` | Organization management; decisions require relevant permissions |
| Arrears follow-ups | `/dashboard/org/collections` | Admin, manager, office, accountant |
| Lease renewal centre | `/dashboard/org/renewals` | Admin, manager, office |
| Activity history | `/dashboard/org/activity` | Admin, manager |
| Staff coverage | `/dashboard/org/handovers` | Admin, manager |
| Property comparison | `/dashboard/org/performance` | Admin, manager, accountant |
| Tenant renewal responses | `/dashboard/tenant/renewals` | Tenant's own offers |

## Approvals

Requests support pending organization expenses, proposed monthly rent changes, rent-charge write-offs, deposit refund authorization, and non-admin staff membership suspension. A different person must review. Source snapshots reject approvals when the underlying terms, balance, expense, refund, or membership have changed. All decisions and policy changes are audited in the same transaction. Requesters can withdraw pending requests.

Administrators review sensitive rent/access changes. Manager/accountant monetary decisions require the relevant permission and must fit the configured limit (zero until configured). Expense creators cannot approve their own expenses even when another staff member submitted the approval request. Staff suspension revokes sessions using that membership; it does not disable the shared account or other memberships.

Saving the approval limit enables that limit and independent financial review on the existing finance ticket and expenditure approval screens too. Existing accounting tickets retain their payable-posting workflow. When a policy is configured, recording an actual deposit refund requires a matching approved refund request. Approval never sends money or claims a refund was paid; the existing move-out proof/reference workflow records actual payment.

Write-offs reduce the charge amount and balance, leave amountPaid unchanged, and record the authorized concession. For charges already accrued into accounting, a balanced expense/receivables adjustment is posted atomically; a closed/locked accounting period prevents the decision. Future rent changes do not rewrite issued bills.

## Payment promises

Create one open promise per overdue lease, with amount, assigned active staff, due date, follow-up date and notes. Payment progress uses the increase in allocated amountPaid since creation. Reversals reduce that progress. The UI derives fulfilled/broken/open status without mutating the source during a read. Recording fulfilment requires enough actual allocated payment progress; recording a broken promise requires the due date to have passed. Record an outcome before replacing a promise. Dates run through the end of the selected Nairobi day.

## Renewals

The centre lists fixed-term active leases expiring within 30, 60 or 90 days, including overdue expirations. Send proposed rent, new end date, and a written notice to the linked tenant's portal. The actual tenant accepts or declines; staff cannot manufacture a tenant acceptance. An administrator finalizes accepted terms if the source lease still matches. Changed rent is finalized when the old term ends; the accepted offer remains pending beforehand. Same-rent extensions can be finalized early. Issued bills and existing documents are preserved. This is renewal tracking and portal acceptance; it does not generate a new external e-signature envelope.

## Coverage

Immediately transfer open CRM tasks/demos, collection promises, and maintenance assignments. The covering staff member must already have active organization-wide access to the relevant workspaces. Roles and permissions are never copied. Overlapping coverage is rejected. Coverage end dates flag a review; an authorized manager explicitly returns unfinished work or confirms a permanent transfer. Returning work only changes originally transferred records that are still open and still assigned to the covering person. Completed and subsequently reassigned records are preserved.

## Reports and activity

Activity search reads existing org-scoped audit events, filtered by action/record text, person and Nairobi date range. It exposes event summaries rather than raw security metadata or confidential before/after payloads.

Property comparison uses database aggregates, with 25 properties per page. Charged/collected values refer to rent charges in the selected month; collections include allocations through the present. Paid costs are property-linked ORG-scope expenses incurred in that month in the organization's currency. Net rental contribution subtracts those costs from collections; it is not a full accounting profit statement. Unassigned overhead, deposits, water and other income are excluded. Arrears, occupancy and current vacancy duration are present-day snapshots, explicitly distinguished from the selected billing period.

## Rollout

Apply `20261110170000_org_management_workflows` before deploying these routes. The migration adds five tables and a composite Lease identity index, with org/lease cascade ownership. The generated organization purge plan includes all new records. Validate against an explicitly disposable local test database; never point integration tests at production. Native screens for these new workspaces are not part of this change.

## Platform organization blacklist lock

Platform Admin → Organizations → select the organization → **Blacklist & access lock** opens the control. Platform administrators and super administrators must enter the exact organization slug and a reason of 5–1000 characters. The native Platform organization cards expose the same blacklist and remove-lock actions. Both call the same authorized server actions.

The lock is independent of ordinary organization status. Blacklisting stores `blacklistedAt` and `blacklistReason`, disables the organization, revokes every current associated user's sessions across all organizations, removes their browser push subscriptions (native devices cascade with sessions), and disables organization API keys plus API keys created by affected users in other organizations. Every session read and session creation checks the lock, including native/API account-setup access and platform administrators. Switching membership cannot bypass it. Public vacancy/BnB eligibility excludes locked organizations, and the public listings API rejects both locked organizations and affected key creators.

Current associations mean memberships without deactivation or employment end dates, tenant profiles without deletion/archive dates, and active non-deleted landlord profiles. This covers organization administrators, managers, office staff, accountants, caretakers, security, tenants and landlords, including users whose active workspace is elsewhere. Historical employment and archived/deleted profiles do not blacklist former users. An unrelated platform administrator can still review and unlock the organization. A platform administrator who is themselves associated with the organization is locked too.

Unlocking requires another explicit reason and slug confirmation. It does not reactivate the organization, restore sessions, or reactivate API keys. Reactivation remains a separate action. A user associated with another locked organization remains blocked. Ordinary status overrides, reactivation, and deletion cannot remove the blacklist flag; remove the lock before deletion. Each lock/unlock writes an audit record containing the actor, reason and previous state. Already downloaded or offline data cannot be remotely withdrawn by a server-side lock.

Deployment: apply `20261110200000_organization_blacklist` before deploying the matching application and regenerate Prisma Client. The migration adds two nullable organization columns and an index; it does not blacklist existing organizations. No configured/live database is changed by implementing this feature. The native backend and app must be released together for the new admin controls.

Validation: `npm run typecheck`, Prisma Client generation, mobile/desktop browser fixture `tests/e2e/organization-blacklist-ui.spec.ts`, and `tests/integration/organization-blacklist.integration.ts`. Integration coverage uses an explicitly configured disposable local database and verifies multi-organization denial, tenant/landlord identities, linked platform admins, unaffected/former users, session/API-key revocation, auditing and overlapping locks.
