-- CreateTable
CREATE TABLE IF NOT EXISTS "RentRewardRedemption" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fulfilledAt" TIMESTAMP(3),

    CONSTRAINT "RentRewardRedemption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RentRewardRedemption_orgId_createdAt_idx" ON "RentRewardRedemption"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS "RentRewardRedemption_tenantId_createdAt_idx" ON "RentRewardRedemption"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "RentRewardRedemption_orgId_status_idx" ON "RentRewardRedemption"("orgId", "status");
CREATE INDEX IF NOT EXISTS "RentRewardRedemption_status_createdAt_idx" ON "RentRewardRedemption"("status", "createdAt");

DO $$ BEGIN
 ALTER TABLE "RentRewardRedemption" ADD CONSTRAINT "RentRewardRedemption_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "RentRewardRedemption" ADD CONSTRAINT "RentRewardRedemption_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
