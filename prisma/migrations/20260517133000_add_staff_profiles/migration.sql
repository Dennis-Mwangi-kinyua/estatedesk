-- Add optional HR profile details for staff memberships.
-- All fields are nullable/defaulted so this is safe for an existing live database.
CREATE TABLE "StaffProfile" (
  "id" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "salaryAmount" DECIMAL(12, 2),
  "salaryCurrency" TEXT NOT NULL DEFAULT 'KES',
  "educationLevel" TEXT,
  "jobTitle" TEXT,
  "nationalId" TEXT,
  "emergencyContact" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffProfile_membershipId_key" ON "StaffProfile"("membershipId");
CREATE INDEX "StaffProfile_salaryCurrency_idx" ON "StaffProfile"("salaryCurrency");
CREATE INDEX "StaffProfile_educationLevel_idx" ON "StaffProfile"("educationLevel");

ALTER TABLE "StaffProfile"
  ADD CONSTRAINT "StaffProfile_membershipId_fkey"
  FOREIGN KEY ("membershipId")
  REFERENCES "Membership"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
