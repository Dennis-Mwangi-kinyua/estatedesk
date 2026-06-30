# EstateDesk Integration Readiness

This document tracks the structural integration layer for the next-generation roadmap while external approvals are pending.

## Current Structure

- Provider catalogue: `src/lib/integrations/providers.ts`
- Readiness report: `src/lib/integrations/readiness.ts`
- Adapter contracts: `src/lib/integrations/contracts.ts`
- Platform visibility: `/platform/jobs` integration readiness section
- Environment placeholders: `.env.example`

## Implementation Rule

Every external provider should be integrated behind a contract before live API code is added. Live adapters must:

- validate required environment values,
- fail closed when approval or credentials are missing,
- persist provider references and raw callbacks where the domain model supports it,
- write retryable failures to the relevant job/attempt table,
- avoid storing tenant PINs, bank passwords, card numbers, or mobile money secrets.

## Phase 1A Shipping Path

1. Replace the M-Pesa STK stub with a Daraja adapter once Safaricom credentials are approved.
2. Add the M-Pesa callback route and reconcile payments by `checkoutRequestId`.
3. Connect eTIMS/KRA invoice submission to `RentalIncomeReturn`, `TaxCharge`, and `KraSubmissionAttempt`.
4. Add bank reconciliation import/API jobs using the existing `Payment.reconciliationStatus` fields.
5. Add WhatsApp inbound webhook routing for payment reminders, maintenance tickets, and tenant replies.

## Approval-Gated Work

- KRA/eTIMS: requires certified production credentials and payload confirmation.
- UAE Aani: requires payment partner onboarding.
- Dubai DLD/Ejari: requires official or partner API access.
- Bank APIs: requires each bank or aggregator agreement.
- CRB/AECB: requires consent wording, data processing review, and provider contracts.
- Escrow/fractional investment: requires licensed financial/legal review before holding or moving funds.

## Adapter Locations

Use these folders as providers become available:

- `src/lib/mpesa` for Daraja STK and callbacks.
- `src/lib/integrations` for shared contracts, readiness, and provider factories.
- `src/lib/cron/jobs.ts` for scheduled sync/reconciliation jobs.
- `src/app/api` for external webhooks and callback routes.
- `src/app/(app)/platform/jobs/page.tsx` for operational visibility.
