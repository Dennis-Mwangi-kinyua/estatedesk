-- CreateEnum
CREATE TYPE "TenantActionType" AS ENUM ('CREATED', 'UPDATED', 'UNLINKED', 'BLACKLISTED', 'UNBLACKLISTED', 'ARCHIVED', 'RESTORED', 'SOFT_DELETED');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "blacklistReason" TEXT,
ADD COLUMN     "blacklistedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TenantActionLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leaseId" TEXT,
    "unitId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "action" "TenantActionType" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantActionLog_orgId_tenantId_createdAt_idx" ON "TenantActionLog"("orgId", "tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantActionLog_tenantId_createdAt_idx" ON "TenantActionLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantActionLog_leaseId_idx" ON "TenantActionLog"("leaseId");

-- CreateIndex
CREATE INDEX "TenantActionLog_unitId_idx" ON "TenantActionLog"("unitId");

-- CreateIndex
CREATE INDEX "TenantActionLog_actorUserId_createdAt_idx" ON "TenantActionLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantActionLog_action_createdAt_idx" ON "TenantActionLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Tenant_archivedAt_idx" ON "Tenant"("archivedAt");

-- CreateIndex
CREATE INDEX "Tenant_blacklistedAt_idx" ON "Tenant"("blacklistedAt");

-- AddForeignKey
ALTER TABLE "TenantActionLog" ADD CONSTRAINT "TenantActionLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantActionLog" ADD CONSTRAINT "TenantActionLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantActionLog" ADD CONSTRAINT "TenantActionLog_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantActionLog" ADD CONSTRAINT "TenantActionLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantActionLog" ADD CONSTRAINT "TenantActionLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
