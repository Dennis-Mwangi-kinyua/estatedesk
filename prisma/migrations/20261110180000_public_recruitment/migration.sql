-- CreateTable
CREATE TABLE "RecruitmentJob" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "postedByName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "workplace" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "salaryMin" DECIMAL(12,2),
    "salaryMax" DECIMAL(12,2),
    "currencyCode" TEXT NOT NULL DEFAULT 'KES',
    "salaryPeriod" TEXT NOT NULL DEFAULT 'MONTH',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "closesAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "coverLetter" TEXT NOT NULL,
    "portfolioUrl" TEXT,
    "resumeFileName" TEXT,
    "resumeBytes" BYTEA,
    "resumeSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentVersion" TEXT NOT NULL DEFAULT '2026-11-10',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "interviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentJob_slug_key" ON "RecruitmentJob"("slug");

-- CreateIndex
CREATE INDEX "RecruitmentJob_orgId_status_createdAt_idx" ON "RecruitmentJob"("orgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RecruitmentJob_status_closesAt_publishedAt_idx" ON "RecruitmentJob"("status", "closesAt", "publishedAt");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_jobId_status_createdAt_idx" ON "RecruitmentApplication"("jobId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentApplication_jobId_email_key" ON "RecruitmentApplication"("jobId", "email");

-- CreateIndex
CREATE INDEX "RecruitmentApplicationEvent_applicationId_createdAt_idx" ON "RecruitmentApplicationEvent"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "RecruitmentJob" ADD CONSTRAINT "RecruitmentJob_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentJob" ADD CONSTRAINT "RecruitmentJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RecruitmentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentApplicationEvent" ADD CONSTRAINT "RecruitmentApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentApplicationEvent" ADD CONSTRAINT "RecruitmentApplicationEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

