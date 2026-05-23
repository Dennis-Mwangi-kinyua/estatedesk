-- AlterEnum
ALTER TYPE "OrgRole" ADD VALUE 'LANDLORD';

-- CreateTable
CREATE TABLE "LandlordProfile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxpayerProfileId" TEXT,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "nationalId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandlordProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandlordAssignment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "landlordProfileId" TEXT NOT NULL,
    "propertyId" TEXT,
    "unitId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandlordAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LandlordProfile_orgId_idx" ON "LandlordProfile"("orgId");

-- CreateIndex
CREATE INDEX "LandlordProfile_userId_idx" ON "LandlordProfile"("userId");

-- CreateIndex
CREATE INDEX "LandlordProfile_taxpayerProfileId_idx" ON "LandlordProfile"("taxpayerProfileId");

-- CreateIndex
CREATE INDEX "LandlordProfile_isActive_idx" ON "LandlordProfile"("isActive");

-- CreateIndex
CREATE INDEX "LandlordProfile_deletedAt_idx" ON "LandlordProfile"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LandlordProfile_orgId_userId_key" ON "LandlordProfile"("orgId", "userId");

-- CreateIndex
CREATE INDEX "LandlordAssignment_orgId_idx" ON "LandlordAssignment"("orgId");

-- CreateIndex
CREATE INDEX "LandlordAssignment_landlordProfileId_idx" ON "LandlordAssignment"("landlordProfileId");

-- CreateIndex
CREATE INDEX "LandlordAssignment_propertyId_idx" ON "LandlordAssignment"("propertyId");

-- CreateIndex
CREATE INDEX "LandlordAssignment_unitId_idx" ON "LandlordAssignment"("unitId");

-- CreateIndex
CREATE INDEX "LandlordAssignment_active_idx" ON "LandlordAssignment"("active");

-- CreateIndex
CREATE INDEX "LandlordAssignment_landlordProfileId_active_propertyId_idx" ON "LandlordAssignment"("landlordProfileId", "active", "propertyId");

-- CreateIndex
CREATE INDEX "LandlordAssignment_landlordProfileId_active_unitId_idx" ON "LandlordAssignment"("landlordProfileId", "active", "unitId");

-- CreateIndex
CREATE INDEX "LandlordAssignment_orgId_active_propertyId_idx" ON "LandlordAssignment"("orgId", "active", "propertyId");

-- CreateIndex
CREATE INDEX "LandlordAssignment_orgId_active_unitId_idx" ON "LandlordAssignment"("orgId", "active", "unitId");

-- AddForeignKey
ALTER TABLE "LandlordProfile" ADD CONSTRAINT "LandlordProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandlordProfile" ADD CONSTRAINT "LandlordProfile_taxpayerProfileId_fkey" FOREIGN KEY ("taxpayerProfileId") REFERENCES "TaxpayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandlordProfile" ADD CONSTRAINT "LandlordProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandlordAssignment" ADD CONSTRAINT "LandlordAssignment_landlordProfileId_fkey" FOREIGN KEY ("landlordProfileId") REFERENCES "LandlordProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandlordAssignment" ADD CONSTRAINT "LandlordAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandlordAssignment" ADD CONSTRAINT "LandlordAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandlordAssignment" ADD CONSTRAINT "LandlordAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
