-- CreateEnum
CREATE TYPE "ExpenditureScope" AS ENUM ('PLATFORM', 'ORGANIZATION', 'TENANT');

-- CreateEnum
CREATE TYPE "ExpenditureCategory" AS ENUM ('MAINTENANCE', 'UTILITIES', 'ADMINISTRATION', 'MARKETING', 'STAFF', 'TAX', 'INSURANCE', 'LEGAL', 'SOFTWARE', 'TRANSPORT', 'TENANT_REPAIR', 'TENANT_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenditureStatus" AS ENUM ('RECORDED', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'REJECTED', 'VOIDED');

-- AlterEnum
ALTER TYPE "AccountingSourceType" ADD VALUE 'EXPENDITURE';

-- CreateTable
CREATE TABLE "Expenditure" (
    "id" TEXT NOT NULL,
    "scope" "ExpenditureScope" NOT NULL,
    "orgId" TEXT,
    "tenantId" TEXT,
    "propertyId" TEXT,
    "unitId" TEXT,
    "category" "ExpenditureCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "payee" TEXT,
    "reference" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "status" "ExpenditureStatus" NOT NULL DEFAULT 'RECORDED',
    "paymentMethod" TEXT,
    "chargeable" BOOLEAN NOT NULL DEFAULT false,
    "attachmentKey" TEXT,
    "journalEntryId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expenditure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expenditure_scope_incurredAt_idx" ON "Expenditure"("scope", "incurredAt");

-- CreateIndex
CREATE INDEX "Expenditure_orgId_incurredAt_idx" ON "Expenditure"("orgId", "incurredAt");

-- CreateIndex
CREATE INDEX "Expenditure_tenantId_incurredAt_idx" ON "Expenditure"("tenantId", "incurredAt");

-- CreateIndex
CREATE INDEX "Expenditure_propertyId_incurredAt_idx" ON "Expenditure"("propertyId", "incurredAt");

-- CreateIndex
CREATE INDEX "Expenditure_status_dueAt_idx" ON "Expenditure"("status", "dueAt");

-- CreateIndex
CREATE INDEX "Expenditure_createdByUserId_createdAt_idx" ON "Expenditure"("createdByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
