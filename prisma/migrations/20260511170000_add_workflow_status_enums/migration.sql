CREATE TYPE "DataExportRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED');

ALTER TABLE "DataExportRequest"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "DataExportRequestStatus" USING "status"::"DataExportRequestStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "Invitation"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "InvitationStatus" USING "status"::"InvitationStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';
