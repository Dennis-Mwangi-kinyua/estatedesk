-- Setup links must support phone-only and username-only accounts.
ALTER TABLE "PasswordResetToken" ADD COLUMN "userId" TEXT;
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
