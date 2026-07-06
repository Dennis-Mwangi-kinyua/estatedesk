-- CreateEnum
CREATE TYPE "AccountingRecognitionMode" AS ENUM ('CASH', 'ACCRUAL');

-- AlterEnum
ALTER TYPE "AccountingSourceType" ADD VALUE 'RENT_CHARGE_ACCRUAL';
ALTER TYPE "AccountingSourceType" ADD VALUE 'WATER_BILL_ACCRUAL';

-- CreateTable
CREATE TABLE "AccountingSettings" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "recognitionMode" "AccountingRecognitionMode" NOT NULL DEFAULT 'ACCRUAL',
    "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
    "autoPostPayments" BOOLEAN NOT NULL DEFAULT true,
    "autoPostBilling" BOOLEAN NOT NULL DEFAULT true,
    "initializedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingSettings_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "RentCharge" ADD COLUMN "journalEntryId" TEXT;

-- AlterTable
ALTER TABLE "WaterBill" ADD COLUMN "journalEntryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccountingSettings_orgId_key" ON "AccountingSettings"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "RentCharge_journalEntryId_key" ON "RentCharge"("journalEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "WaterBill_journalEntryId_key" ON "WaterBill"("journalEntryId");

-- AddForeignKey
ALTER TABLE "AccountingSettings" ADD CONSTRAINT "AccountingSettings_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentCharge" ADD CONSTRAINT "RentCharge_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "AccountingJournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterBill" ADD CONSTRAINT "WaterBill_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "AccountingJournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;