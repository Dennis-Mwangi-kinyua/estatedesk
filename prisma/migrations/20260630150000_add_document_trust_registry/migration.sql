-- Universal identity, verification, and evidence registry for generated documents.
CREATE TYPE "DocumentType" AS ENUM (
  'RECEIPT',
  'LEASE',
  'INVOICE',
  'NOTICE',
  'INSPECTION_REPORT',
  'OWNER_STATEMENT',
  'RECONCILIATION_REPORT',
  'DATA_EXPORT',
  'OTHER'
);

CREATE TYPE "DocumentStatus" AS ENUM (
  'DRAFT',
  'ISSUED',
  'COMPLETED',
  'SUPERSEDED',
  'REVOKED',
  'EXPIRED'
);

CREATE TYPE "DocumentEventType" AS ENUM (
  'CREATED',
  'ISSUED',
  'VIEWED',
  'DOWNLOADED',
  'VERIFIED',
  'SIGNING_REQUESTED',
  'SIGNED',
  'COMPLETED',
  'SUPERSEDED',
  'REVOKED'
);

CREATE TABLE "DocumentRecord" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "serialNumber" TEXT NOT NULL,
  "verificationCode" TEXT NOT NULL,
  "documentType" "DocumentType" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "DocumentStatus" NOT NULL DEFAULT 'ISSUED',
  "title" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
  "contentHash" TEXT,
  "issuedByUserId" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "supersededAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revocationReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentEvent" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "eventType" "DocumentEventType" NOT NULL,
  "actorUserId" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DocumentEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Receipt" ADD COLUMN "documentId" TEXT;

CREATE UNIQUE INDEX "DocumentRecord_serialNumber_key" ON "DocumentRecord"("serialNumber");
CREATE UNIQUE INDEX "DocumentRecord_verificationCode_key" ON "DocumentRecord"("verificationCode");
CREATE UNIQUE INDEX "DocumentRecord_orgId_documentType_entityType_entityId_version_key"
  ON "DocumentRecord"("orgId", "documentType", "entityType", "entityId", "version");
CREATE INDEX "DocumentRecord_orgId_documentType_issuedAt_idx"
  ON "DocumentRecord"("orgId", "documentType", "issuedAt");
CREATE INDEX "DocumentRecord_orgId_status_issuedAt_idx"
  ON "DocumentRecord"("orgId", "status", "issuedAt");
CREATE INDEX "DocumentRecord_entityType_entityId_idx" ON "DocumentRecord"("entityType", "entityId");
CREATE INDEX "DocumentRecord_contentHash_idx" ON "DocumentRecord"("contentHash");
CREATE INDEX "DocumentRecord_issuedByUserId_issuedAt_idx"
  ON "DocumentRecord"("issuedByUserId", "issuedAt");

CREATE INDEX "DocumentEvent_documentId_createdAt_idx" ON "DocumentEvent"("documentId", "createdAt");
CREATE INDEX "DocumentEvent_orgId_eventType_createdAt_idx"
  ON "DocumentEvent"("orgId", "eventType", "createdAt");
CREATE INDEX "DocumentEvent_actorUserId_createdAt_idx"
  ON "DocumentEvent"("actorUserId", "createdAt");

CREATE UNIQUE INDEX "Receipt_documentId_key" ON "Receipt"("documentId");

ALTER TABLE "DocumentRecord"
  ADD CONSTRAINT "DocumentRecord_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentRecord"
  ADD CONSTRAINT "DocumentRecord_issuedByUserId_fkey"
  FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentEvent"
  ADD CONSTRAINT "DocumentEvent_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentEvent"
  ADD CONSTRAINT "DocumentEvent_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "DocumentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentEvent"
  ADD CONSTRAINT "DocumentEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Receipt"
  ADD CONSTRAINT "Receipt_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "DocumentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
