-- CreateEnum
CREATE TYPE "AccountingRequestType" AS ENUM ('REIMBURSEMENT', 'VENDOR_PAYMENT', 'PETTY_CASH', 'ADVANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountingRequestStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNTING_REQUEST_SUBMITTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNTING_REQUEST_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNTING_REQUEST_REJECTED';

-- CreateTable
CREATE TABLE "AccountingRequest" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "type" "AccountingRequestType" NOT NULL DEFAULT 'OTHER',
    "status" "AccountingRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'KES',
    "propertyId" TEXT,
    "vendorName" TEXT,
    "payeeName" TEXT,
    "reference" TEXT,
    "attachmentKey" TEXT,
    "submittedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerFeedback" TEXT,
    "internalNotes" TEXT,
    "vendorBillId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingRequestEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "status" "AccountingRequestStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingRequest_orgId_requestNumber_key" ON "AccountingRequest"("orgId", "requestNumber");

-- CreateIndex
CREATE INDEX "AccountingRequest_orgId_status_createdAt_idx" ON "AccountingRequest"("orgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AccountingRequest_submittedByUserId_createdAt_idx" ON "AccountingRequest"("submittedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AccountingRequest_orgId_submittedByUserId_status_idx" ON "AccountingRequest"("orgId", "submittedByUserId", "status");

-- CreateIndex
CREATE INDEX "AccountingRequestEvent_requestId_createdAt_idx" ON "AccountingRequestEvent"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "AccountingRequestEvent_actorUserId_createdAt_idx" ON "AccountingRequestEvent"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AccountingRequest" ADD CONSTRAINT "AccountingRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingRequest" ADD CONSTRAINT "AccountingRequest_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingRequest" ADD CONSTRAINT "AccountingRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingRequestEvent" ADD CONSTRAINT "AccountingRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AccountingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingRequestEvent" ADD CONSTRAINT "AccountingRequestEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;