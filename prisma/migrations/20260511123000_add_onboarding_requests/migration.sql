CREATE TABLE "OnboardingRequest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "phone" TEXT,
    "managedPropertyType" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'REGISTER_PAGE',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OnboardingRequest_status_createdAt_idx" ON "OnboardingRequest"("status", "createdAt");
CREATE INDEX "OnboardingRequest_workEmail_createdAt_idx" ON "OnboardingRequest"("workEmail", "createdAt");
CREATE INDEX "OnboardingRequest_createdAt_idx" ON "OnboardingRequest"("createdAt");
