-- CreateEnum
CREATE TYPE "LeaseSigningOrder" AS ENUM ('SEQUENTIAL', 'PARALLEL');

-- CreateEnum
CREATE TYPE "LeaseSigningJurisdiction" AS ENUM ('KENYA', 'UAE');

-- CreateEnum
CREATE TYPE "LeaseSignatureMethod" AS ENUM ('TYPED', 'DRAWN', 'UPLOADED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeaseSignerRole" ADD VALUE 'WITNESS';
ALTER TYPE "LeaseSignerRole" ADD VALUE 'GUARANTOR';
ALTER TYPE "LeaseSignerRole" ADD VALUE 'LANDLORD';

-- DropIndex
DROP INDEX "LeaseSignatureSigner_envelopeId_role_key";

-- AlterTable
ALTER TABLE "LeaseSignatureEnvelope" ADD COLUMN     "amendmentOfId" TEXT,
ADD COLUMN     "consentText" TEXT NOT NULL DEFAULT 'I intend to sign this lease electronically and consent to the capture of signing evidence.',
ADD COLUMN     "jurisdiction" "LeaseSigningJurisdiction" NOT NULL DEFAULT 'KENYA',
ADD COLUMN     "signingOrder" "LeaseSigningOrder" NOT NULL DEFAULT 'SEQUENTIAL',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "LeaseSignatureSigner" ADD COLUMN     "label" TEXT,
ADD COLUMN     "signatureAssetKey" TEXT,
ADD COLUMN     "signatureImageHash" TEXT,
ADD COLUMN     "signatureMethod" "LeaseSignatureMethod",
ADD COLUMN     "signingOrder" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "LeaseSignatureEnvelope_finalDocumentHash_key" ON "LeaseSignatureEnvelope"("finalDocumentHash");

-- CreateIndex
CREATE INDEX "LeaseSignatureSigner_envelopeId_signingOrder_idx" ON "LeaseSignatureSigner"("envelopeId", "signingOrder");
