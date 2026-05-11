ALTER TABLE "OnboardingRequest"
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "handledAt" TIMESTAMP(3),
ADD COLUMN "handledByUserId" TEXT;

CREATE INDEX "OnboardingRequest_handledByUserId_handledAt_idx" ON "OnboardingRequest"("handledByUserId", "handledAt");

ALTER TABLE "OnboardingRequest" ADD CONSTRAINT "OnboardingRequest_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
