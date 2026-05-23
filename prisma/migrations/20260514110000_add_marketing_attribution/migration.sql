CREATE TYPE "MarketerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE "MarketingCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

CREATE TABLE "PlatformMarketer" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "referralCode" TEXT NOT NULL,
  "defaultCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "status" "MarketerStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlatformMarketer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OnboardingRequest"
  ADD COLUMN "marketerId" TEXT,
  ADD COLUMN "referralCode" TEXT,
  ADD COLUMN "commissionRate" DECIMAL(5,2),
  ADD COLUMN "commissionStatus" "MarketingCommissionStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "commissionNotes" TEXT;

ALTER TABLE "Organization"
  ADD COLUMN "marketerId" TEXT,
  ADD COLUMN "referralCode" TEXT,
  ADD COLUMN "commissionRate" DECIMAL(5,2),
  ADD COLUMN "commissionStatus" "MarketingCommissionStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "commissionNotes" TEXT;

CREATE UNIQUE INDEX "PlatformMarketer_referralCode_key" ON "PlatformMarketer"("referralCode");
CREATE INDEX "PlatformMarketer_status_idx" ON "PlatformMarketer"("status");
CREATE INDEX "PlatformMarketer_deletedAt_idx" ON "PlatformMarketer"("deletedAt");
CREATE INDEX "PlatformMarketer_createdAt_idx" ON "PlatformMarketer"("createdAt");

CREATE INDEX "OnboardingRequest_marketerId_idx" ON "OnboardingRequest"("marketerId");
CREATE INDEX "OnboardingRequest_referralCode_idx" ON "OnboardingRequest"("referralCode");
CREATE INDEX "OnboardingRequest_commissionStatus_idx" ON "OnboardingRequest"("commissionStatus");

CREATE INDEX "Organization_marketerId_idx" ON "Organization"("marketerId");
CREATE INDEX "Organization_referralCode_idx" ON "Organization"("referralCode");
CREATE INDEX "Organization_commissionStatus_idx" ON "Organization"("commissionStatus");

ALTER TABLE "OnboardingRequest"
  ADD CONSTRAINT "OnboardingRequest_marketerId_fkey"
  FOREIGN KEY ("marketerId") REFERENCES "PlatformMarketer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_marketerId_fkey"
  FOREIGN KEY ("marketerId") REFERENCES "PlatformMarketer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
