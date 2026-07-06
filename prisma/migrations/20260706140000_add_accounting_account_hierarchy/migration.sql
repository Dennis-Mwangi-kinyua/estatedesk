-- AlterTable
ALTER TABLE "AccountingAccount" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "AccountingAccount_orgId_parentId_idx" ON "AccountingAccount"("orgId", "parentId");

-- AddForeignKey
ALTER TABLE "AccountingAccount" ADD CONSTRAINT "AccountingAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AccountingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;