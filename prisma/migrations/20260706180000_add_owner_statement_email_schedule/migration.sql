-- AlterTable
ALTER TABLE "AccountingSettings" ADD COLUMN "ownerStatementEmailEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AccountingSettings" ADD COLUMN "ownerStatementEmailDayOfMonth" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "AccountingSettings" ADD COLUMN "ownerStatementLastSentAt" TIMESTAMP(3);