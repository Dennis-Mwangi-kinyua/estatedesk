-- Public vacancy publish control + stable unique slugs + richer enquiries

ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "isPubliclyListed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "publicSlug" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Unit_publicSlug_key" ON "Unit"("publicSlug");
CREATE INDEX IF NOT EXISTS "Unit_isPubliclyListed_status_isActive_deletedAt_idx"
  ON "Unit"("isPubliclyListed", "status", "isActive", "deletedAt");

ALTER TABLE "VacancyInquiry" ADD COLUMN IF NOT EXISTS "preferredLocation" TEXT;
ALTER TABLE "VacancyInquiry" ADD COLUMN IF NOT EXISTS "budget" TEXT;
ALTER TABLE "VacancyInquiry" ADD COLUMN IF NOT EXISTS "referralSource" TEXT;
