ALTER TABLE "User"
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "termsAcceptedVersion" TEXT;

CREATE INDEX "User_termsAcceptedAt_idx" ON "User"("termsAcceptedAt");
