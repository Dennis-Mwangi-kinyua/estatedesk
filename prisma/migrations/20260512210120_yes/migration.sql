-- DropIndex
DROP INDEX "User_mustChangePassword_idx";

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "coveredPeriods" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "IssueResolutionReport_tenantConfirmedByUserId_tenantConfirmedAt" RENAME TO "IssueResolutionReport_tenantConfirmedByUserId_tenantConfirm_idx";
