-- AlterTable
ALTER TABLE "IssueTicket" ADD COLUMN     "assignedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "IssueTicket_assignedByUserId_idx" ON "IssueTicket"("assignedByUserId");

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
