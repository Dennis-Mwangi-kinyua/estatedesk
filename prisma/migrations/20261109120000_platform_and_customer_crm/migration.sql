-- CreateEnum
CREATE TYPE "SalesStage" AS ENUM ('NEW', 'QUALIFIED', 'DEMO_SCHEDULED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "CrmActivityKind" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'DEMO', 'TASK', 'CHANGE');

-- AlterTable
ALTER TABLE "OnboardingRequest" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'KES',
ADD COLUMN     "customerOrgId" TEXT,
ADD COLUMN     "demoAt" TIMESTAMP(3),
ADD COLUMN     "expectedMonthlyValue" DECIMAL(12,2),
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "salesOwnerId" TEXT,
ADD COLUMN     "salesStage" "SalesStage" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "targetPlan" TEXT;

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "tenantId" TEXT,
    "customerOrgId" TEXT,
    "scopeOrgId" TEXT,
    "authorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "kind" "CrmActivityKind" NOT NULL DEFAULT 'NOTE',
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "subject" TEXT,
    "deliveryStatus" TEXT,
    "requestKey" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmActivity_requestKey_key" ON "CrmActivity"("requestKey");

-- CreateIndex
CREATE INDEX "CrmActivity_leadId_createdAt_idx" ON "CrmActivity"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "CrmActivity_tenantId_scopeOrgId_createdAt_idx" ON "CrmActivity"("tenantId", "scopeOrgId", "createdAt");

-- CreateIndex
CREATE INDEX "CrmActivity_customerOrgId_createdAt_idx" ON "CrmActivity"("customerOrgId", "createdAt");

-- CreateIndex
CREATE INDEX "CrmActivity_scopeOrgId_completedAt_dueAt_idx" ON "CrmActivity"("scopeOrgId", "completedAt", "dueAt");

-- CreateIndex
CREATE INDEX "CrmActivity_assigneeId_completedAt_dueAt_idx" ON "CrmActivity"("assigneeId", "completedAt", "dueAt");

-- CreateIndex
CREATE INDEX "OnboardingRequest_salesStage_updatedAt_idx" ON "OnboardingRequest"("salesStage", "updatedAt");

-- CreateIndex
CREATE INDEX "OnboardingRequest_salesOwnerId_salesStage_idx" ON "OnboardingRequest"("salesOwnerId", "salesStage");

-- CreateIndex
CREATE INDEX "OnboardingRequest_customerOrgId_idx" ON "OnboardingRequest"("customerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_id_orgId_key" ON "Tenant"("id", "orgId");

-- AddForeignKey
ALTER TABLE "OnboardingRequest" ADD CONSTRAINT "OnboardingRequest_salesOwnerId_fkey" FOREIGN KEY ("salesOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingRequest" ADD CONSTRAINT "OnboardingRequest_customerOrgId_fkey" FOREIGN KEY ("customerOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "OnboardingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_tenantId_scopeOrgId_fkey" FOREIGN KEY ("tenantId", "scopeOrgId") REFERENCES "Tenant"("id", "orgId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_customerOrgId_fkey" FOREIGN KEY ("customerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_scopeOrgId_fkey" FOREIGN KEY ("scopeOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve the existing onboarding sales outcomes when introducing the pipeline.
UPDATE "OnboardingRequest"
SET "salesStage" = CASE
  WHEN "status" = 'WON' THEN 'WON'::"SalesStage"
  WHEN "status" = 'QUALIFIED' THEN 'QUALIFIED'::"SalesStage"
  WHEN "status" IN ('DISQUALIFIED', 'CLOSED', 'REJECTED') THEN 'LOST'::"SalesStage"
  ELSE 'NEW'::"SalesStage"
END;

ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_target_check" CHECK (
  num_nonnulls("leadId", "tenantId", "customerOrgId") = 1
  AND (("tenantId" IS NOT NULL AND "scopeOrgId" IS NOT NULL)
    OR ("tenantId" IS NULL AND "scopeOrgId" IS NULL))
);
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_priority_check"
  CHECK ("priority" IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));
ALTER TABLE "OnboardingRequest" ADD CONSTRAINT "OnboardingRequest_monthly_value_check"
  CHECK ("expectedMonthlyValue" IS NULL OR "expectedMonthlyValue" >= 0);
