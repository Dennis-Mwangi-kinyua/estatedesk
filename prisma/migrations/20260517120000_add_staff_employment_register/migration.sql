ALTER TABLE "Membership"
  ADD COLUMN "employmentStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "employmentEndedAt" TIMESTAMP(3),
  ADD COLUMN "employmentExitReason" TEXT,
  ADD COLUMN "deactivatedAt" TIMESTAMP(3),
  ADD COLUMN "deactivatedByUserId" TEXT,
  ADD COLUMN "deactivationNotes" TEXT;

UPDATE "Membership"
SET "employmentStartedAt" = "createdAt"
WHERE "employmentStartedAt" IS NOT NULL;

CREATE INDEX "Membership_orgId_employmentEndedAt_idx" ON "Membership"("orgId", "employmentEndedAt");
CREATE INDEX "Membership_userId_employmentEndedAt_idx" ON "Membership"("userId", "employmentEndedAt");
