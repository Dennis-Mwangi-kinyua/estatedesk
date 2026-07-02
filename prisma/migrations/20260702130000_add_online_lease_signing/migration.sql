-- CreateEnum
CREATE TYPE "LeaseSignatureEnvelopeStatus" AS ENUM ('PENDING', 'PARTIALLY_SIGNED', 'FINALIZING', 'COMPLETED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaseSignerRole" AS ENUM ('ORGANIZATION', 'TENANT');

-- CreateEnum
CREATE TYPE "LeaseSignerStatus" AS ENUM ('PENDING', 'SIGNED', 'DECLINED');

-- CreateEnum
CREATE TYPE "LeaseSignatureEventType" AS ENUM ('CREATED', 'VIEWED', 'SIGNED', 'DECLINED', 'REMINDER_SENT', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "LeaseSignatureEnvelope" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "sourceAssetId" TEXT NOT NULL,
    "finalAssetId" TEXT,
    "sourceDocumentHash" TEXT NOT NULL,
    "finalDocumentHash" TEXT,
    "status" "LeaseSignatureEnvelopeStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "consentVersion" TEXT NOT NULL DEFAULT '2026-07-02',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseSignatureEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseSignatureSigner" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "LeaseSignerRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "LeaseSignerStatus" NOT NULL DEFAULT 'PENDING',
    "signatureText" TEXT,
    "consentAcceptedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastReminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseSignatureSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseSignatureEvent" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "eventType" "LeaseSignatureEventType" NOT NULL,
    "actorUserId" TEXT,
    "signerId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseSignatureEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaseSignatureEnvelope_orgId_status_createdAt_idx" ON "LeaseSignatureEnvelope"("orgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LeaseSignatureEnvelope_leaseId_createdAt_idx" ON "LeaseSignatureEnvelope"("leaseId", "createdAt");

-- CreateIndex
CREATE INDEX "LeaseSignatureEnvelope_expiresAt_status_idx" ON "LeaseSignatureEnvelope"("expiresAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseSignatureSigner_tokenHash_key" ON "LeaseSignatureSigner"("tokenHash");

-- CreateIndex
CREATE INDEX "LeaseSignatureSigner_userId_status_idx" ON "LeaseSignatureSigner"("userId", "status");

-- CreateIndex
CREATE INDEX "LeaseSignatureSigner_envelopeId_status_idx" ON "LeaseSignatureSigner"("envelopeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseSignatureSigner_envelopeId_role_key" ON "LeaseSignatureSigner"("envelopeId", "role");

-- CreateIndex
CREATE INDEX "LeaseSignatureEvent_envelopeId_createdAt_idx" ON "LeaseSignatureEvent"("envelopeId", "createdAt");

-- CreateIndex
CREATE INDEX "LeaseSignatureEvent_eventType_createdAt_idx" ON "LeaseSignatureEvent"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "LeaseSignatureEnvelope" ADD CONSTRAINT "LeaseSignatureEnvelope_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseSignatureEnvelope" ADD CONSTRAINT "LeaseSignatureEnvelope_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseSignatureSigner" ADD CONSTRAINT "LeaseSignatureSigner_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "LeaseSignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseSignatureEvent" ADD CONSTRAINT "LeaseSignatureEvent_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "LeaseSignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
