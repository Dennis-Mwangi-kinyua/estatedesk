ALTER TYPE "ProviderStatus" ADD VALUE IF NOT EXISTS 'CHANGES_REQUESTED';
ALTER TYPE "ProviderStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

CREATE TYPE "JobApplicationStatus" AS ENUM ('PENDING', 'REVIEWING', 'SELECTED', 'DECLINED', 'WITHDRAWN', 'CANCELLED');

ALTER TABLE "ServiceProvider"
ADD COLUMN "reviewFeedback" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "JobApplication"
ADD COLUMN "status" "JobApplicationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "JobApplication_providerId_status_updatedAt_idx"
ON "JobApplication"("providerId", "status", "updatedAt");
