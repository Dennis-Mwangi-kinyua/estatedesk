# Kenya Legal Technical Alignment

Status: **READY FOR QUALIFIED COUNSEL REVIEW** (not legal approval)

Last updated: 2026-07-04

This document maps published EstateDesk policy pages to implemented product behavior so Kenyan counsel can review faster. It is not legal advice.

## Controller and processor roles

| Actor | Typical role | Product evidence |
| --- | --- | --- |
| Customer organization | Data controller for tenant, staff, lease, payment, and property records it enters | Org-scoped RBAC, org retention settings, org exports |
| EstateDesk platform operator | Processor for customer-entered records; controller for platform account, billing, and security operations | Platform admin routes, audit logs, subscription records |
| Tenants / staff / caretakers | Data subjects within customer organizations | Role-specific dashboards, notification preferences, access guards |

Counsel should confirm controller/processor wording in customer contracts and public notices.

## Published documents vs implementation

| Topic | Public page | Implementation reference | Alignment |
| --- | --- | --- | --- |
| Privacy notice | `/privacy` | RBAC in `src/lib/permissions/`, private dashboard indexing | Aligned at high level; subprocessors now listed in privacy page |
| Terms | `/terms` | `src/lib/terms.ts`, registration and subscription flows | Aligned at high level |
| Security | `/security` | Session signing, audit logs, rate limits, security alerts | Claims should be reviewed against actual production configuration |
| Data processing / retention | `/data-processing` | `src/lib/data-retention/report.ts`, `/api/cron/retention` | Retention enforcement is report-first; counsel should confirm sufficiency |
| Subprocessors | `/privacy` | `src/lib/legal/trust-content.ts`, `docs/ENVIRONMENT.md` | List is category-based until vendor names are finalized in contracts |
| Exports | `/data-processing` | `src/lib/data-export/org-export.ts`, `SYNC_EXPORT_ROW_LIMIT` | Export access is admin-gated; row limits exist |
| Audit logs | `/security` | `src/lib/audit/security.ts`, platform audit routes | Implemented |
| M-Pesa / bank processing | Terms + integration docs | `src/lib/integrations/providers.ts`, payment lifecycle | Live adapters are approval-gated; marketing must not imply live status before approval |
| KRA / eTIMS | Integration docs | Tax charges, KRA attempts tables | Not live until certified credentials are configured |
| ODPC obligations | Counsel checklist | No ODPC filing evidence in repo | **Requires counsel determination** |

## Data categories and retention hooks

| Category | Stored in product | Retention / deletion hooks |
| --- | --- | --- |
| Tenant identity and contact | `Tenant`, linked `User` | Soft delete + retention report |
| Leases and notices | `Lease`, `MoveOutNotice` | Soft delete + retention report |
| Payments and reconciliation | `Payment`, allocations | Reversal workflows, audit logs |
| Issues and inspections | `IssueTicket`, inspection records | Org-scoped access, audit trail |
| Notifications | `Notification` | User-scoped reads, channel metadata |
| Public vacancy enquiries | Marketing / vacancy flows | Separate from authenticated tenant records |
| Platform audit and security | Audit logs, security alerts | Operations runbook + webhook alerts |

## Communication and consent items for counsel

- Email, SMS, WhatsApp, and web-push notifications are implemented with channel metadata.
- Marketing analytics and ads tags are disabled by default and documented as post-consent in `docs/ENVIRONMENT.md`.
- Direct marketing consent language is **not yet customized per channel** in customer contracts.

## Gaps counsel should resolve before sign-off

1. Name exact subprocessors and hosting regions in customer-facing documents.
2. Confirm ODPC registration / notification obligations for EstateDesk as operator.
3. Approve controller/processor clauses for customer onboarding contracts.
4. Confirm lawful basis and notice text for tenants, caretakers, staff, and vacancy applicants.
5. Confirm M-Pesa, bank, and KRA processing statements match go-live integration status.
6. Approve retention periods per record type under Kenyan tenancy, tax, and audit practice.
7. Approve breach-notification workflow and customer communication templates.

## Sign-off block

- Reviewer and firm:
- Date and jurisdiction:
- Documents/version reviewed:
- Required amendments:
- Residual risks accepted by:
- Final approval evidence:

When counsel signs off, update `docs/KENYA_LEGAL_REVIEW.md` and `docs/PRE_LAUNCH_STATUS.md`.