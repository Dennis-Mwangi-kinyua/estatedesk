CREATE TYPE "ProviderJobPaymentMethod" AS ENUM ('MPESA', 'BANK_TRANSFER', 'CASH', 'OTHER');
CREATE TYPE "ProviderJobPaymentStatus" AS ENUM ('RECORDED', 'CONFIRMED', 'DISPUTED', 'VOIDED');

ALTER TABLE "ServiceJob"
ADD COLUMN "paymentTracking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "agreedAmount" DECIMAL(12,2);

CREATE TABLE "ProviderJobPayment" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" "ProviderJobPaymentMethod" NOT NULL,
  "reference" TEXT,
  "note" TEXT,
  "status" "ProviderJobPaymentStatus" NOT NULL DEFAULT 'RECORDED',
  "reportedByUserId" TEXT NOT NULL,
  "providerResponseNote" TEXT,
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "confirmedAt" TIMESTAMP(3),
  CONSTRAINT "ProviderJobPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProviderJobPayment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ProviderJobPayment_jobId_status_createdAt_idx"
ON "ProviderJobPayment"("jobId", "status", "createdAt");
