-- CreateEnum
CREATE TYPE "TenantTransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TenantTransferRequest" (
    "id" TEXT NOT NULL,
    "sourceOrgId" TEXT NOT NULL,
    "targetOrgId" TEXT NOT NULL,
    "sourceTenantId" TEXT NOT NULL,
    "createdTenantId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "status" "TenantTransferStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "reviewNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantTransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantTransferRequest_createdTenantId_key" ON "TenantTransferRequest"("createdTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantTransferRequest_sourceTenantId_targetOrgId_status_key" ON "TenantTransferRequest"("sourceTenantId", "targetOrgId", "status");

-- CreateIndex
CREATE INDEX "TenantTransferRequest_sourceOrgId_status_requestedAt_idx" ON "TenantTransferRequest"("sourceOrgId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "TenantTransferRequest_targetOrgId_status_requestedAt_idx" ON "TenantTransferRequest"("targetOrgId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "TenantTransferRequest_requestedByUserId_idx" ON "TenantTransferRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "TenantTransferRequest_reviewedByUserId_idx" ON "TenantTransferRequest"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "TenantTransferRequest_createdTenantId_idx" ON "TenantTransferRequest"("createdTenantId");

-- AddForeignKey
ALTER TABLE "TenantTransferRequest" ADD CONSTRAINT "TenantTransferRequest_createdTenantId_fkey" FOREIGN KEY ("createdTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantTransferRequest" ADD CONSTRAINT "TenantTransferRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantTransferRequest" ADD CONSTRAINT "TenantTransferRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantTransferRequest" ADD CONSTRAINT "TenantTransferRequest_sourceOrgId_fkey" FOREIGN KEY ("sourceOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantTransferRequest" ADD CONSTRAINT "TenantTransferRequest_sourceTenantId_fkey" FOREIGN KEY ("sourceTenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantTransferRequest" ADD CONSTRAINT "TenantTransferRequest_targetOrgId_fkey" FOREIGN KEY ("targetOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
