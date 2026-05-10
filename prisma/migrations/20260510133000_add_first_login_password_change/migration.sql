ALTER TABLE "User"
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

CREATE INDEX "User_mustChangePassword_idx" ON "User"("mustChangePassword");
