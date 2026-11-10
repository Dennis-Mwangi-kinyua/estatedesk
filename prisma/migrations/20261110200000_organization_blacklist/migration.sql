ALTER TABLE "Organization" ADD COLUMN "blacklistedAt" TIMESTAMP(3), ADD COLUMN "blacklistReason" TEXT;
CREATE INDEX "Organization_blacklistedAt_idx" ON "Organization"("blacklistedAt");
