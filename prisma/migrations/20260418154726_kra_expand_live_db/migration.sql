-- CreateEnum
CREATE TYPE "TaxpayerKind" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "PayerType" AS ENUM ('TENANT', 'USER', 'ORGANIZATION', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "KraFilingChannel" AS ENUM ('GAVACONNECT', 'ERITS_MANUAL', 'ECITIZEN_MANUAL', 'IMPORTED');

-- CreateEnum
CREATE TYPE "KraFilingStatus" AS ENUM ('DRAFT', 'READY', 'SUBMITTED', 'ACKNOWLEDGED', 'PAYMENT_PENDING', 'PAID', 'REJECTED', 'FAILED', 'MANUAL_REVIEW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KraAttemptOutcome" AS ENUM ('SUCCESS', 'FAILED', 'RETRYABLE');

-- CreateEnum
CREATE TYPE "KraFilingMode" AS ENUM ('API', 'ERITS_MANUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "KraEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ERROR');

-- CreateEnum
CREATE TYPE "RentalTaxRegime" AS ENUM ('MRI', 'ANNUAL_RETURN');

-- CreateEnum
CREATE TYPE "RentalAssessmentBasis" AS ENUM ('GROSS_RENT_BILLED', 'GROSS_RENT_COLLECTED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "payerName" TEXT,
ADD COLUMN     "payerType" "PayerType" NOT NULL DEFAULT 'TENANT',
ADD COLUMN     "payerUserId" TEXT,
ADD COLUMN     "rentalReturnId" TEXT,
ALTER COLUMN "payerTenantId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "taxpayerProfileId" TEXT;

-- AlterTable
ALTER TABLE "TaxCharge" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "filingStatus" "KraFilingStatus",
ADD COLUMN     "rawKraResponse" JSONB,
ADD COLUMN     "rentalReturnId" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ALTER COLUMN "taxRate" SET DATA TYPE DECIMAL(7,4);

-- CreateTable
CREATE TABLE "TaxpayerProfile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "kraPin" TEXT NOT NULL,
    "kind" "TaxpayerKind" NOT NULL DEFAULT 'INDIVIDUAL',
    "email" TEXT,
    "phone" TEXT,
    "nationalId" TEXT,
    "companyRegNo" TEXT,
    "isResident" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxpayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KraIntegration" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "filingMode" "KraFilingMode" NOT NULL DEFAULT 'HYBRID',
    "environment" "KraEnvironment" NOT NULL DEFAULT 'SANDBOX',
    "clientId" TEXT,
    "clientSecretCiphertext" TEXT,
    "accessTokenCiphertext" TEXT,
    "refreshTokenCiphertext" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "apiBaseUrl" TEXT,
    "eritsBaseUrl" TEXT,
    "webhookSecretCiphertext" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KraIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalIncomeReturn" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "taxpayerProfileId" TEXT,
    "propertyId" TEXT,
    "filingKey" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "regime" "RentalTaxRegime" NOT NULL DEFAULT 'MRI',
    "basis" "RentalAssessmentBasis" NOT NULL DEFAULT 'GROSS_RENT_BILLED',
    "filingChannel" "KraFilingChannel" NOT NULL DEFAULT 'ERITS_MANUAL',
    "status" "KraFilingStatus" NOT NULL DEFAULT 'DRAFT',
    "isNilReturn" BOOLEAN NOT NULL DEFAULT false,
    "grossRent" DECIMAL(14,2) NOT NULL,
    "taxableGrossRent" DECIMAL(14,2) NOT NULL,
    "taxRate" DECIMAL(7,4) NOT NULL,
    "taxDue" DECIMAL(14,2) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'KES',
    "taxpayerPin" TEXT NOT NULL,
    "taxpayerName" TEXT,
    "eligibilityNotes" TEXT,
    "assessmentRef" TEXT,
    "kraReturnRef" TEXT,
    "kraPaymentRef" TEXT,
    "kraReceiptNo" TEXT,
    "preparedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "submittedByUserId" TEXT,
    "lastError" TEXT,
    "rawRequest" JSONB,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalIncomeReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalIncomeReturnItem" (
    "id" TEXT NOT NULL,
    "rentalReturnId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "leaseId" TEXT,
    "rentChargeId" TEXT,
    "description" TEXT,
    "grossRent" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalIncomeReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KraSubmissionAttempt" (
    "id" TEXT NOT NULL,
    "rentalReturnId" TEXT NOT NULL,
    "channel" "KraFilingChannel" NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "httpStatus" INTEGER,
    "outcome" "KraAttemptOutcome" NOT NULL,
    "errorMessage" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KraSubmissionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxpayerProfile_orgId_idx" ON "TaxpayerProfile"("orgId");

-- CreateIndex
CREATE INDEX "TaxpayerProfile_kraPin_idx" ON "TaxpayerProfile"("kraPin");

-- CreateIndex
CREATE INDEX "TaxpayerProfile_isResident_idx" ON "TaxpayerProfile"("isResident");

-- CreateIndex
CREATE INDEX "TaxpayerProfile_isActive_idx" ON "TaxpayerProfile"("isActive");

-- CreateIndex
CREATE INDEX "TaxpayerProfile_deletedAt_idx" ON "TaxpayerProfile"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxpayerProfile_orgId_kraPin_key" ON "TaxpayerProfile"("orgId", "kraPin");

-- CreateIndex
CREATE UNIQUE INDEX "KraIntegration_orgId_key" ON "KraIntegration"("orgId");

-- CreateIndex
CREATE INDEX "KraIntegration_status_idx" ON "KraIntegration"("status");

-- CreateIndex
CREATE INDEX "KraIntegration_environment_idx" ON "KraIntegration"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "RentalIncomeReturn_filingKey_key" ON "RentalIncomeReturn"("filingKey");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_orgId_period_idx" ON "RentalIncomeReturn"("orgId", "period");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_taxpayerProfileId_idx" ON "RentalIncomeReturn"("taxpayerProfileId");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_propertyId_idx" ON "RentalIncomeReturn"("propertyId");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_status_idx" ON "RentalIncomeReturn"("status");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_filingChannel_idx" ON "RentalIncomeReturn"("filingChannel");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_taxpayerPin_idx" ON "RentalIncomeReturn"("taxpayerPin");

-- CreateIndex
CREATE INDEX "RentalIncomeReturn_submittedAt_idx" ON "RentalIncomeReturn"("submittedAt");

-- CreateIndex
CREATE INDEX "RentalIncomeReturnItem_rentalReturnId_idx" ON "RentalIncomeReturnItem"("rentalReturnId");

-- CreateIndex
CREATE INDEX "RentalIncomeReturnItem_propertyId_idx" ON "RentalIncomeReturnItem"("propertyId");

-- CreateIndex
CREATE INDEX "RentalIncomeReturnItem_unitId_idx" ON "RentalIncomeReturnItem"("unitId");

-- CreateIndex
CREATE INDEX "RentalIncomeReturnItem_leaseId_idx" ON "RentalIncomeReturnItem"("leaseId");

-- CreateIndex
CREATE INDEX "RentalIncomeReturnItem_rentChargeId_idx" ON "RentalIncomeReturnItem"("rentChargeId");

-- CreateIndex
CREATE INDEX "KraSubmissionAttempt_rentalReturnId_attemptedAt_idx" ON "KraSubmissionAttempt"("rentalReturnId", "attemptedAt");

-- CreateIndex
CREATE INDEX "KraSubmissionAttempt_outcome_idx" ON "KraSubmissionAttempt"("outcome");

-- CreateIndex
CREATE INDEX "KraSubmissionAttempt_channel_idx" ON "KraSubmissionAttempt"("channel");

-- CreateIndex
CREATE INDEX "Payment_payerUserId_createdAt_idx" ON "Payment"("payerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_rentalReturnId_idx" ON "Payment"("rentalReturnId");

-- CreateIndex
CREATE INDEX "Property_taxpayerProfileId_idx" ON "Property"("taxpayerProfileId");

-- CreateIndex
CREATE INDEX "Property_type_idx" ON "Property"("type");

-- CreateIndex
CREATE INDEX "TaxCharge_rentalReturnId_idx" ON "TaxCharge"("rentalReturnId");

-- CreateIndex
CREATE INDEX "TaxCharge_filingStatus_idx" ON "TaxCharge"("filingStatus");

-- AddForeignKey
ALTER TABLE "TaxpayerProfile" ADD CONSTRAINT "TaxpayerProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KraIntegration" ADD CONSTRAINT "KraIntegration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_taxpayerProfileId_fkey" FOREIGN KEY ("taxpayerProfileId") REFERENCES "TaxpayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncomeReturn" ADD CONSTRAINT "RentalIncomeReturn_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncomeReturn" ADD CONSTRAINT "RentalIncomeReturn_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncomeReturn" ADD CONSTRAINT "RentalIncomeReturn_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncomeReturn" ADD CONSTRAINT "RentalIncomeReturn_taxpayerProfileId_fkey" FOREIGN KEY ("taxpayerProfileId") REFERENCES "TaxpayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncomeReturnItem" ADD CONSTRAINT "RentalIncomeReturnItem_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncomeReturnItem" ADD CONSTRAINT "RentalIncomeReturnItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncomeReturnItem" ADD CONSTRAINT "RentalIncomeReturnItem_rentChargeId_fkey" FOREIGN KEY ("rentChargeId") REFERENCES "RentCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncomeReturnItem" ADD CONSTRAINT "RentalIncomeReturnItem_rentalReturnId_fkey" FOREIGN KEY ("rentalReturnId") REFERENCES "RentalIncomeReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncomeReturnItem" ADD CONSTRAINT "RentalIncomeReturnItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KraSubmissionAttempt" ADD CONSTRAINT "KraSubmissionAttempt_rentalReturnId_fkey" FOREIGN KEY ("rentalReturnId") REFERENCES "RentalIncomeReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCharge" ADD CONSTRAINT "TaxCharge_rentalReturnId_fkey" FOREIGN KEY ("rentalReturnId") REFERENCES "RentalIncomeReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentalReturnId_fkey" FOREIGN KEY ("rentalReturnId") REFERENCES "RentalIncomeReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
