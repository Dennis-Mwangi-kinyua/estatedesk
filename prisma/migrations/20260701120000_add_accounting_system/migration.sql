-- CreateEnum
CREATE TYPE "AccountingAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountingBalanceSide" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "AccountingPeriodStatus" AS ENUM ('OPEN', 'LOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AccountingJournalStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED', 'VOIDED');

-- CreateEnum
CREATE TYPE "AccountingSourceType" AS ENUM ('MANUAL', 'PAYMENT', 'PAYMENT_REVERSAL', 'VENDOR_BILL', 'BILL_PAYMENT', 'OPENING_BALANCE', 'ADJUSTMENT', 'OWNER_DISTRIBUTION');

-- CreateEnum
CREATE TYPE "AccountingBankAccountType" AS ENUM ('BANK', 'MPESA', 'CASH', 'PETTY_CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountingTaxCodeType" AS ENUM ('VAT_INPUT', 'VAT_OUTPUT', 'WITHHOLDING', 'EXEMPT', 'ZERO_RATED', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountingBillStatus" AS ENUM ('DRAFT', 'APPROVED', 'PARTIAL', 'PAID', 'VOIDED');

-- CreateEnum
CREATE TYPE "AccountingBudgetStatus" AS ENUM ('DRAFT', 'APPROVED', 'CLOSED');

-- CreateTable
CREATE TABLE "AccountingAccount" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountingAccountType" NOT NULL,
    "normalBalance" "AccountingBalanceSide" NOT NULL,
    "systemKey" TEXT,
    "description" TEXT,
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingPeriod" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AccountingPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingJournalEntry" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "periodId" TEXT,
    "entryNumber" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "memo" TEXT,
    "status" "AccountingJournalStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceType" "AccountingSourceType" NOT NULL,
    "sourceId" TEXT,
    "reversalOfId" TEXT,
    "postedAt" TIMESTAMP(3),
    "postedByUserId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingJournalLine" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "propertyId" TEXT,
    "unitId" TEXT,
    "tenantId" TEXT,
    "vendorId" TEXT,
    "landlordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingJournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingBankAccount" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "ledgerAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountingBankAccountType" NOT NULL,
    "institutionName" TEXT,
    "accountNumberMasked" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'KES',
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "openingBalanceDate" TIMESTAMP(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingVendor" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "kraPin" TEXT,
    "address" TEXT,
    "paymentTerms" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingTaxCode" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(7,4) NOT NULL,
    "type" "AccountingTaxCodeType" NOT NULL,
    "payableAccountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingTaxCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingVendorBill" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "AccountingBillStatus" NOT NULL DEFAULT 'DRAFT',
    "currencyCode" TEXT NOT NULL DEFAULT 'KES',
    "subtotal" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "amountPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "propertyId" TEXT,
    "unitId" TEXT,
    "notes" TEXT,
    "attachmentKey" TEXT,
    "journalEntryId" TEXT,
    "createdByUserId" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingVendorBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingVendorBillLine" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "taxCodeId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,

    CONSTRAINT "AccountingVendorBillLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingBudget" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AccountingBudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingBudgetLine" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "AccountingBudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingAccount_orgId_type_isActive_idx" ON "AccountingAccount"("orgId", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingAccount_orgId_code_key" ON "AccountingAccount"("orgId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingAccount_orgId_systemKey_key" ON "AccountingAccount"("orgId", "systemKey");

-- CreateIndex
CREATE INDEX "AccountingPeriod_orgId_status_startsAt_idx" ON "AccountingPeriod"("orgId", "status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPeriod_orgId_startsAt_endsAt_key" ON "AccountingPeriod"("orgId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingJournalEntry_reversalOfId_key" ON "AccountingJournalEntry"("reversalOfId");

-- CreateIndex
CREATE INDEX "AccountingJournalEntry_orgId_entryDate_status_idx" ON "AccountingJournalEntry"("orgId", "entryDate", "status");

-- CreateIndex
CREATE INDEX "AccountingJournalEntry_periodId_status_idx" ON "AccountingJournalEntry"("periodId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingJournalEntry_orgId_entryNumber_key" ON "AccountingJournalEntry"("orgId", "entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingJournalEntry_orgId_sourceType_sourceId_key" ON "AccountingJournalEntry"("orgId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "AccountingJournalLine_orgId_accountId_idx" ON "AccountingJournalLine"("orgId", "accountId");

-- CreateIndex
CREATE INDEX "AccountingJournalLine_journalId_idx" ON "AccountingJournalLine"("journalId");

-- CreateIndex
CREATE INDEX "AccountingJournalLine_propertyId_idx" ON "AccountingJournalLine"("propertyId");

-- CreateIndex
CREATE INDEX "AccountingJournalLine_unitId_idx" ON "AccountingJournalLine"("unitId");

-- CreateIndex
CREATE INDEX "AccountingJournalLine_tenantId_idx" ON "AccountingJournalLine"("tenantId");

-- CreateIndex
CREATE INDEX "AccountingJournalLine_vendorId_idx" ON "AccountingJournalLine"("vendorId");

-- CreateIndex
CREATE INDEX "AccountingBankAccount_orgId_type_isActive_idx" ON "AccountingBankAccount"("orgId", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingBankAccount_orgId_name_key" ON "AccountingBankAccount"("orgId", "name");

-- CreateIndex
CREATE INDEX "AccountingVendor_orgId_isActive_idx" ON "AccountingVendor"("orgId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingVendor_orgId_name_key" ON "AccountingVendor"("orgId", "name");

-- CreateIndex
CREATE INDEX "AccountingTaxCode_orgId_type_isActive_idx" ON "AccountingTaxCode"("orgId", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingTaxCode_orgId_code_key" ON "AccountingTaxCode"("orgId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingVendorBill_journalEntryId_key" ON "AccountingVendorBill"("journalEntryId");

-- CreateIndex
CREATE INDEX "AccountingVendorBill_orgId_status_dueDate_idx" ON "AccountingVendorBill"("orgId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "AccountingVendorBill_propertyId_idx" ON "AccountingVendorBill"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingVendorBill_orgId_vendorId_billNumber_key" ON "AccountingVendorBill"("orgId", "vendorId", "billNumber");

-- CreateIndex
CREATE INDEX "AccountingVendorBillLine_billId_idx" ON "AccountingVendorBillLine"("billId");

-- CreateIndex
CREATE INDEX "AccountingVendorBillLine_accountId_idx" ON "AccountingVendorBillLine"("accountId");

-- CreateIndex
CREATE INDEX "AccountingBudget_orgId_status_idx" ON "AccountingBudget"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingBudget_orgId_periodId_name_key" ON "AccountingBudget"("orgId", "periodId", "name");

-- CreateIndex
CREATE INDEX "AccountingBudgetLine_budgetId_idx" ON "AccountingBudgetLine"("budgetId");

-- CreateIndex
CREATE INDEX "AccountingBudgetLine_accountId_idx" ON "AccountingBudgetLine"("accountId");

-- AddForeignKey
ALTER TABLE "AccountingAccount" ADD CONSTRAINT "AccountingAccount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingPeriod" ADD CONSTRAINT "AccountingPeriod_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournalEntry" ADD CONSTRAINT "AccountingJournalEntry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournalEntry" ADD CONSTRAINT "AccountingJournalEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournalEntry" ADD CONSTRAINT "AccountingJournalEntry_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "AccountingJournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournalLine" ADD CONSTRAINT "AccountingJournalLine_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "AccountingJournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingJournalLine" ADD CONSTRAINT "AccountingJournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingBankAccount" ADD CONSTRAINT "AccountingBankAccount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingBankAccount" ADD CONSTRAINT "AccountingBankAccount_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "AccountingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingVendor" ADD CONSTRAINT "AccountingVendor_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingTaxCode" ADD CONSTRAINT "AccountingTaxCode_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingVendorBill" ADD CONSTRAINT "AccountingVendorBill_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingVendorBill" ADD CONSTRAINT "AccountingVendorBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "AccountingVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingVendorBillLine" ADD CONSTRAINT "AccountingVendorBillLine_billId_fkey" FOREIGN KEY ("billId") REFERENCES "AccountingVendorBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingVendorBillLine" ADD CONSTRAINT "AccountingVendorBillLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingVendorBillLine" ADD CONSTRAINT "AccountingVendorBillLine_taxCodeId_fkey" FOREIGN KEY ("taxCodeId") REFERENCES "AccountingTaxCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingBudget" ADD CONSTRAINT "AccountingBudget_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingBudget" ADD CONSTRAINT "AccountingBudget_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingBudgetLine" ADD CONSTRAINT "AccountingBudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "AccountingBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingBudgetLine" ADD CONSTRAINT "AccountingBudgetLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AccountingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
