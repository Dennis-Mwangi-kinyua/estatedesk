-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UnitType" ADD VALUE 'STUDIO';
ALTER TYPE "UnitType" ADD VALUE 'SINGLE_ROOM';

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "sequenceNo" INTEGER,
ADD COLUMN     "sourcePlanId" TEXT;

-- CreateTable
CREATE TABLE "PropertyUnitPlan" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitType" "UnitType" NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "defaultRentAmount" DECIMAL(12,2) NOT NULL,
    "defaultDepositAmount" DECIMAL(12,2),
    "houseNoPrefix" TEXT,
    "startNumber" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyUnitPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyUnitPlan_propertyId_idx" ON "PropertyUnitPlan"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyUnitPlan_propertyId_unitType_bedrooms_idx" ON "PropertyUnitPlan"("propertyId", "unitType", "bedrooms");

-- CreateIndex
CREATE INDEX "PropertyUnitPlan_propertyId_sortOrder_idx" ON "PropertyUnitPlan"("propertyId", "sortOrder");

-- CreateIndex
CREATE INDEX "Unit_sourcePlanId_idx" ON "Unit"("sourcePlanId");

-- CreateIndex
CREATE INDEX "Unit_propertyId_type_bedrooms_status_idx" ON "Unit"("propertyId", "type", "bedrooms", "status");

-- AddForeignKey
ALTER TABLE "PropertyUnitPlan" ADD CONSTRAINT "PropertyUnitPlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_sourcePlanId_fkey" FOREIGN KEY ("sourcePlanId") REFERENCES "PropertyUnitPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
