# Kenya Legal And Privacy Review Handoff

Status: **TECHNICAL ALIGNMENT COMPLETE — QUALIFIED KENYAN COUNSEL SIGN-OFF STILL REQUIRED**

Last updated: 2026-07-04

This is a review checklist, not legal advice or legal approval.

## Counsel packet

- Technical alignment memo: `docs/KENYA_LEGAL_TECHNICAL_ALIGNMENT.md`
- Environment and retention controls: `docs/ENVIRONMENT.md`, `docs/OPERATIONS.md`
- Integration readiness and provider boundaries: `docs/INTEGRATION_READINESS.md`
- Public API and data exposure: `docs/API.md`

## Published policy pages to review

| Document | Route | Source |
| --- | --- | --- |
| Privacy notice | `/privacy` | `src/app/(marketing)/privacy/page.tsx`, `src/lib/legal/trust-content.ts` |
| Terms of service | `/terms` | `src/app/(marketing)/terms/page.tsx`, `src/lib/terms.ts` |
| Security overview | `/security` | `src/app/(marketing)/security/page.tsx` |
| Data processing and retention | `/data-processing` | `src/app/(marketing)/data-processing/page.tsx` |
| Terms PDF | `/api/legal/terms.pdf` | `src/app/api/legal/terms.pdf/route.ts` |

## Review checklist

- Confirm EstateDesk/customer controller and processor roles under the Data Protection Act, 2019
- Review privacy notice, terms, security claims, DPA, subprocessors, cross-border transfers, and breach process
- Confirm lawful bases and notices for tenants, staff, caretakers, applicants, and vacancy enquiries
- Confirm retention periods for leases, identity data, payments, receipts, inspections, issues, audit logs, and backups
- Review M-Pesa/bank reference processing, reconciliation evidence, reversals, KRA/eTIMS records, and data-subject requests
- Confirm direct-marketing consent and communication rules for email, SMS, and WhatsApp
- Confirm ODPC registration/notification obligations and customer contract clauses
- Review production incident, deletion, export, and government/law-enforcement request procedures
- Confirm public marketing claims match actual product behavior and integration readiness

## Counsel sign-off

- Reviewer and firm:
- Date and jurisdiction:
- Documents/version reviewed:
- Required amendments:
- Residual risks accepted by:
- Final approval evidence:

When complete, update `docs/PRE_LAUNCH_STATUS.md`.