-- AlterTable
ALTER TABLE "CaretakerAssignment" ADD COLUMN     "unitId" TEXT;

-- CreateIndex
CREATE INDEX "CaretakerAssignment_unitId_idx" ON "CaretakerAssignment"("unitId");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_caretakerUserId_active_unitId_idx" ON "CaretakerAssignment"("caretakerUserId", "active", "unitId");

-- CreateIndex
CREATE INDEX "CaretakerAssignment_orgId_active_unitId_idx" ON "CaretakerAssignment"("orgId", "active", "unitId");

-- AddForeignKey
ALTER TABLE "CaretakerAssignment" ADD CONSTRAINT "CaretakerAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
