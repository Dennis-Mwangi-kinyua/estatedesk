-- CreateEnum
CREATE TYPE "TenantHistoryStatus" AS ENUM ('VACATED', 'TRANSFERRED', 'ACTIVE_RECORD', 'ARCHIVED');

-- CreateTable
CREATE TABLE "TenantIdentity" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "primaryPhone" TEXT,
    "primaryEmail" TEXT,
    "nationalId" TEXT,
    "kraPin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantHistoryRecord" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "identityId" TEXT,
    "leaseId" TEXT,
    "moveOutNoticeId" TEXT,
    "status" "TenantHistoryStatus" NOT NULL DEFAULT 'VACATED',
    "propertyName" TEXT,
    "buildingName" TEXT,
    "unitHouseNo" TEXT,
    "leaseStartDate" TIMESTAMP(3),
    "leaseEndDate" TIMESTAMP(3),
    "moveOutDate" TIMESTAMP(3),
    "monthlyRent" DECIMAL(12,2),
    "deposit" DECIMAL(12,2),
    "paymentCount" INTEGER NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantHistoryRecord_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "identityId" TEXT;

-- CreateIndex
CREATE INDEX "TenantIdentity_displayName_idx" ON "TenantIdentity"("displayName");

-- CreateIndex
CREATE INDEX "TenantIdentity_primaryPhone_idx" ON "TenantIdentity"("primaryPhone");

-- CreateIndex
CREATE INDEX "TenantIdentity_primaryEmail_idx" ON "TenantIdentity"("primaryEmail");

-- CreateIndex
CREATE INDEX "TenantIdentity_nationalId_idx" ON "TenantIdentity"("nationalId");

-- CreateIndex
CREATE INDEX "TenantIdentity_kraPin_idx" ON "TenantIdentity"("kraPin");

-- CreateIndex
CREATE INDEX "TenantIdentity_createdAt_idx" ON "TenantIdentity"("createdAt");

-- CreateIndex
CREATE INDEX "TenantIdentity_updatedAt_idx" ON "TenantIdentity"("updatedAt");

-- CreateIndex
CREATE INDEX "TenantHistoryRecord_orgId_createdAt_idx" ON "TenantHistoryRecord"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantHistoryRecord_tenantId_createdAt_idx" ON "TenantHistoryRecord"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantHistoryRecord_identityId_createdAt_idx" ON "TenantHistoryRecord"("identityId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantHistoryRecord_leaseId_idx" ON "TenantHistoryRecord"("leaseId");

-- CreateIndex
CREATE INDEX "TenantHistoryRecord_moveOutNoticeId_idx" ON "TenantHistoryRecord"("moveOutNoticeId");

-- CreateIndex
CREATE INDEX "TenantHistoryRecord_status_createdAt_idx" ON "TenantHistoryRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TenantHistoryRecord_moveOutDate_idx" ON "TenantHistoryRecord"("moveOutDate");

-- CreateIndex
CREATE INDEX "Tenant_identityId_idx" ON "Tenant"("identityId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "TenantIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantHistoryRecord" ADD CONSTRAINT "TenantHistoryRecord_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "TenantIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantHistoryRecord" ADD CONSTRAINT "TenantHistoryRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantHistoryRecord" ADD CONSTRAINT "TenantHistoryRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill tenant identities from existing tenant phone numbers so old tenant rows can be linked immediately.
INSERT INTO "TenantIdentity" ("id", "displayName", "primaryPhone", "createdAt", "updatedAt")
SELECT
  'tenant_identity_' || md5("phone") AS "id",
  MIN("fullName") AS "displayName",
  "phone" AS "primaryPhone",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Tenant"
WHERE "phone" IS NOT NULL
GROUP BY "phone"
ON CONFLICT DO NOTHING;

UPDATE "Tenant"
SET "identityId" = 'tenant_identity_' || md5("phone")
WHERE "identityId" IS NULL
  AND "phone" IS NOT NULL;
