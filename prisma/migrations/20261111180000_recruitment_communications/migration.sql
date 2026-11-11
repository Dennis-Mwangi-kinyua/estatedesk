ALTER TABLE "RecruitmentApplication" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'UNSPECIFIED';
ALTER TABLE "RecruitmentApplicationEvent" ADD COLUMN "interviewDetails" TEXT;
CREATE TABLE "RecruitmentCommunication" (
  "id" TEXT NOT NULL, "jobId" TEXT NOT NULL, "applicationId" TEXT,
  "dedupeKey" TEXT NOT NULL, "kind" TEXT NOT NULL, "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL, "body" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "expectedVersion" TIMESTAMP(3), "interviewEventId" TEXT, "deadlineAt" TIMESTAMP(3), "interviewAt" TIMESTAMP(3),
  "approvedByUserId" TEXT, "approvedAt" TIMESTAMP(3), "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0, "lockedAt" TIMESTAMP(3), "firstAttemptAt" TIMESTAMP(3), "acceptedAt" TIMESTAMP(3), "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecruitmentCommunication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecruitmentCommunication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RecruitmentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RecruitmentCommunication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RecruitmentCommunication_dedupeKey_key" ON "RecruitmentCommunication"("dedupeKey");
CREATE INDEX "RecruitmentCommunication_status_scheduledAt_idx" ON "RecruitmentCommunication"("status", "scheduledAt");
CREATE INDEX "RecruitmentCommunication_applicationId_createdAt_idx" ON "RecruitmentCommunication"("applicationId", "createdAt");
CREATE INDEX "RecruitmentCommunication_jobId_createdAt_idx" ON "RecruitmentCommunication"("jobId", "createdAt");
