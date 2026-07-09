-- AlterTable
ALTER TABLE "PlatformControl" ADD COLUMN IF NOT EXISTS "incidentMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlatformControl" ADD COLUMN IF NOT EXISTS "incidentMessage" TEXT;
ALTER TABLE "PlatformControl" ADD COLUMN IF NOT EXISTS "lastBackupAt" TIMESTAMP(3);
ALTER TABLE "PlatformControl" ADD COLUMN IF NOT EXISTS "lastBackupNote" TEXT;
ALTER TABLE "PlatformControl" ADD COLUMN IF NOT EXISTS "lastBackupStatus" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlatformWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "summary" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlatformWebhookEvent_provider_createdAt_idx" ON "PlatformWebhookEvent"("provider", "createdAt");
CREATE INDEX IF NOT EXISTS "PlatformWebhookEvent_createdAt_idx" ON "PlatformWebhookEvent"("createdAt");
