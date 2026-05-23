CREATE TABLE "PlatformMessage" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformMessage_orgId_createdAt_idx" ON "PlatformMessage"("orgId", "createdAt");
CREATE INDEX "PlatformMessage_senderUserId_createdAt_idx" ON "PlatformMessage"("senderUserId", "createdAt");
CREATE INDEX "PlatformMessage_status_createdAt_idx" ON "PlatformMessage"("status", "createdAt");

ALTER TABLE "PlatformMessage" ADD CONSTRAINT "PlatformMessage_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformMessage" ADD CONSTRAINT "PlatformMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
