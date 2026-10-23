CREATE TABLE "WorkflowSubmission" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "resourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowSubmission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkflowSubmission_actorUserId_createdAt_idx" ON "WorkflowSubmission"("actorUserId", "createdAt");
