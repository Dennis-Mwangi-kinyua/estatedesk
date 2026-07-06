-- AlterTable
ALTER TABLE "AccountingPeriod" ADD COLUMN "closeNotes" TEXT;

-- AlterTable
ALTER TABLE "AccountingBankAccount" ADD COLUMN "lastReconciledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AccountingBudget" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "AccountingBudget" ADD COLUMN "approvedByUserId" TEXT;

-- CreateEnum
CREATE TYPE "AccountingBankReconciliationStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateTable
CREATE TABLE "AccountingBankReconciliation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "statementBalance" DECIMAL(14,2) NOT NULL,
    "glBalance" DECIMAL(14,2) NOT NULL,
    "status" "AccountingBankReconciliationStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingBankReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingBankReconciliationItem" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "journalLineId" TEXT,
    "description" TEXT,
    "statementDate" TIMESTAMP(3),
    "statementRef" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "isCleared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingBankReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingBankReconciliation_orgId_bankAccountId_periodEnd_idx" ON "AccountingBankReconciliation"("orgId", "bankAccountId", "periodEnd");

-- CreateIndex
CREATE INDEX "AccountingBankReconciliation_orgId_status_periodEnd_idx" ON "AccountingBankReconciliation"("orgId", "status", "periodEnd");

-- CreateIndex
CREATE INDEX "AccountingBankReconciliationItem_reconciliationId_idx" ON "AccountingBankReconciliationItem"("reconciliationId");

-- CreateIndex
CREATE INDEX "AccountingBankReconciliationItem_journalLineId_idx" ON "AccountingBankReconciliationItem"("journalLineId");

-- AddForeignKey
ALTER TABLE "AccountingBankReconciliation" ADD CONSTRAINT "AccountingBankReconciliation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingBankReconciliation" ADD CONSTRAINT "AccountingBankReconciliation_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "AccountingBankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingBankReconciliationItem" ADD CONSTRAINT "AccountingBankReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "AccountingBankReconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;