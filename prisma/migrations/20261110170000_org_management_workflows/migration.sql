-- CreateTable
CREATE TABLE "OrgManagementApproval" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "reason" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgManagementApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgManagementPolicy" (
    "orgId" TEXT NOT NULL,
    "managerApprovalLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgManagementPolicy_pkey" PRIMARY KEY ("orgId")
);

-- CreateTable
CREATE TABLE "CollectionPromise" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "followUpAt" TIMESTAMP(3) NOT NULL,
    "baselinePaid" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT NOT NULL,
    "outcomeNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionPromise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseRenewal" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "proposedRent" DECIMAL(12,2) NOT NULL,
    "proposedEndDate" TIMESTAMP(3) NOT NULL,
    "originalEndDate" TIMESTAMP(3) NOT NULL,
    "originalRent" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFERED',
    "notice" TEXT NOT NULL,
    "responseNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffHandover" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT NOT NULL,
    "assignments" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffHandover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgManagementApproval_orgId_status_createdAt_idx" ON "OrgManagementApproval"("orgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "OrgManagementApproval_orgId_kind_targetId_idx" ON "OrgManagementApproval"("orgId", "kind", "targetId");

-- CreateIndex
CREATE INDEX "CollectionPromise_orgId_status_dueAt_idx" ON "CollectionPromise"("orgId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "CollectionPromise_orgId_assigneeId_followUpAt_idx" ON "CollectionPromise"("orgId", "assigneeId", "followUpAt");

-- CreateIndex
CREATE INDEX "CollectionPromise_orgId_leaseId_idx" ON "CollectionPromise"("orgId", "leaseId");

-- CreateIndex
CREATE INDEX "LeaseRenewal_orgId_status_createdAt_idx" ON "LeaseRenewal"("orgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LeaseRenewal_orgId_leaseId_idx" ON "LeaseRenewal"("orgId", "leaseId");

-- CreateIndex
CREATE INDEX "StaffHandover_orgId_status_endsAt_idx" ON "StaffHandover"("orgId", "status", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lease_id_orgId_key" ON "Lease"("id", "orgId");

-- AddForeignKey
ALTER TABLE "OrgManagementApproval" ADD CONSTRAINT "OrgManagementApproval_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgManagementPolicy" ADD CONSTRAINT "OrgManagementPolicy_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionPromise" ADD CONSTRAINT "CollectionPromise_leaseId_orgId_fkey" FOREIGN KEY ("leaseId", "orgId") REFERENCES "Lease"("id", "orgId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionPromise" ADD CONSTRAINT "CollectionPromise_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseRenewal" ADD CONSTRAINT "LeaseRenewal_leaseId_orgId_fkey" FOREIGN KEY ("leaseId", "orgId") REFERENCES "Lease"("id", "orgId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseRenewal" ADD CONSTRAINT "LeaseRenewal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffHandover" ADD CONSTRAINT "StaffHandover_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

