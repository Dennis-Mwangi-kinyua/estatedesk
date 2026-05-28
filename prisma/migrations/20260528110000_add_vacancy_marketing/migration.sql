-- Vacancy marketing fields, unit gallery assets, and public enquiries.
ALTER TABLE "Asset" ADD COLUMN "unitId" TEXT;

ALTER TABLE "Unit"
  ADD COLUMN "roomCount" INTEGER,
  ADD COLUMN "hasBalcony" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "serviceCharge" DECIMAL(12, 2),
  ADD COLUMN "garbageFee" DECIMAL(12, 2),
  ADD COLUMN "securityFee" DECIMAL(12, 2),
  ADD COLUMN "electricityBilling" TEXT,
  ADD COLUMN "viewingFeeRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "viewingFeeAmount" DECIMAL(12, 2);

CREATE TABLE "VacancyInquiry" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VacancyInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Asset_unitId_idx" ON "Asset"("unitId");
CREATE INDEX "VacancyInquiry_orgId_createdAt_idx" ON "VacancyInquiry"("orgId", "createdAt");
CREATE INDEX "VacancyInquiry_unitId_createdAt_idx" ON "VacancyInquiry"("unitId", "createdAt");
CREATE INDEX "VacancyInquiry_status_createdAt_idx" ON "VacancyInquiry"("status", "createdAt");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VacancyInquiry" ADD CONSTRAINT "VacancyInquiry_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VacancyInquiry" ADD CONSTRAINT "VacancyInquiry_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
