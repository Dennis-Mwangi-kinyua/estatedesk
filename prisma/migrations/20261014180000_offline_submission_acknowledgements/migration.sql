CREATE TABLE "OfflineSubmission" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientId" VARCHAR(120) NOT NULL,
  "kind" VARCHAR(32) NOT NULL,
  "payloadHash" CHAR(64) NOT NULL,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfflineSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OfflineSubmission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OfflineSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OfflineSubmission_orgId_userId_clientId_key" ON "OfflineSubmission"("orgId", "userId", "clientId");
CREATE INDEX "OfflineSubmission_orgId_createdAt_idx" ON "OfflineSubmission"("orgId", "createdAt");
