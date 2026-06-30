-- Add an auditable reconciliation workflow for finance teams.
CREATE TYPE "PaymentReconciliationStatus" AS ENUM (
  'UNRECONCILED',
  'RECONCILED',
  'DISPUTED'
);

ALTER TABLE "Payment"
  ADD COLUMN "reconciliationStatus" "PaymentReconciliationStatus" NOT NULL DEFAULT 'UNRECONCILED',
  ADD COLUMN "reconciledAt" TIMESTAMP(3),
  ADD COLUMN "reconciledByUserId" TEXT,
  ADD COLUMN "reconciliationNotes" TEXT;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_reconciledByUserId_fkey"
  FOREIGN KEY ("reconciledByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Payment_orgId_reconciliationStatus_createdAt_idx"
  ON "Payment"("orgId", "reconciliationStatus", "createdAt");

CREATE INDEX "Payment_reconciledByUserId_reconciledAt_idx"
  ON "Payment"("reconciledByUserId", "reconciledAt");
