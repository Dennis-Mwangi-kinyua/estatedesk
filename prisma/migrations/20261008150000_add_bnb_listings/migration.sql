CREATE TYPE "BnbListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED');
CREATE TABLE "BnbListing" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "address" TEXT,
  "propertyType" TEXT NOT NULL DEFAULT 'APARTMENT',
  "bedrooms" INTEGER NOT NULL DEFAULT 1,
  "bathrooms" INTEGER NOT NULL DEFAULT 1,
  "beds" INTEGER NOT NULL DEFAULT 1,
  "maxGuests" INTEGER NOT NULL DEFAULT 2,
  "nightlyRate" DECIMAL(12,2) NOT NULL,
  "cleaningFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "minimumNights" INTEGER NOT NULL DEFAULT 1,
  "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "houseRules" TEXT,
  "contactName" TEXT NOT NULL,
  "contactPhone" TEXT NOT NULL,
  "contactEmail" TEXT,
  "status" "BnbListingStatus" NOT NULL DEFAULT 'DRAFT',
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BnbListing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BnbListing_rates_check" CHECK ("nightlyRate" > 0 AND "cleaningFee" >= 0),
  CONSTRAINT "BnbListing_capacity_check" CHECK ("bedrooms" >= 0 AND "bathrooms" >= 1 AND "beds" >= 1 AND "maxGuests" >= 1 AND "minimumNights" >= 1)
);
CREATE UNIQUE INDEX "BnbListing_slug_key" ON "BnbListing"("slug");
CREATE INDEX "BnbListing_orgId_deletedAt_createdAt_idx" ON "BnbListing"("orgId", "deletedAt", "createdAt");
CREATE INDEX "BnbListing_status_deletedAt_location_idx" ON "BnbListing"("status", "deletedAt", "location");
ALTER TABLE "BnbListing" ADD CONSTRAINT "BnbListing_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD COLUMN "bnbListingId" TEXT;
CREATE INDEX "Asset_bnbListingId_idx" ON "Asset"("bnbListingId");
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_bnbListingId_fkey" FOREIGN KEY ("bnbListingId") REFERENCES "BnbListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
