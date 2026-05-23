-- CreateEnum
CREATE TYPE "IssueResolutionReportStatus" AS ENUM ('SUBMITTED', 'OFFICE_APPROVED', 'TENANT_CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "IssueResolutionReport" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "caretakerUserId" TEXT NOT NULL,
    "officeReviewedByUserId" TEXT,
    "tenantConfirmedByUserId" TEXT,
    "status" "IssueResolutionReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "workSummary" TEXT NOT NULL,
    "materialsUsed" TEXT,
    "tenantInstructions" TEXT,
    "officeNotes" TEXT,
    "tenantFeedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "officeReviewedAt" TIMESTAMP(3),
    "tenantConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueResolutionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueResolutionReport_issueId_status_idx" ON "IssueResolutionReport"("issueId", "status");

-- CreateIndex
CREATE INDEX "IssueResolutionReport_orgId_status_submittedAt_idx" ON "IssueResolutionReport"("orgId", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "IssueResolutionReport_caretakerUserId_submittedAt_idx" ON "IssueResolutionReport"("caretakerUserId", "submittedAt");

-- CreateIndex
CREATE INDEX "IssueResolutionReport_tenantConfirmedByUserId_tenantConfirmedAt_idx" ON "IssueResolutionReport"("tenantConfirmedByUserId", "tenantConfirmedAt");

-- AddForeignKey
ALTER TABLE "IssueResolutionReport" ADD CONSTRAINT "IssueResolutionReport_caretakerUserId_fkey" FOREIGN KEY ("caretakerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueResolutionReport" ADD CONSTRAINT "IssueResolutionReport_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "IssueTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueResolutionReport" ADD CONSTRAINT "IssueResolutionReport_officeReviewedByUserId_fkey" FOREIGN KEY ("officeReviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueResolutionReport" ADD CONSTRAINT "IssueResolutionReport_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueResolutionReport" ADD CONSTRAINT "IssueResolutionReport_tenantConfirmedByUserId_fkey" FOREIGN KEY ("tenantConfirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
