CREATE TYPE "CronJobStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

ALTER TYPE "PaymentMethod" ADD VALUE 'MPESA_MANUAL';

CREATE TABLE "CronJobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "endpoint" TEXT,
    "triggerSource" TEXT NOT NULL,
    "status" "CronJobStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "error" TEXT,
    "actorUserId" TEXT,

    CONSTRAINT "CronJobRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CronJobRun_jobName_startedAt_idx" ON "CronJobRun"("jobName", "startedAt");
CREATE INDEX "CronJobRun_status_startedAt_idx" ON "CronJobRun"("status", "startedAt");
CREATE INDEX "CronJobRun_actorUserId_startedAt_idx" ON "CronJobRun"("actorUserId", "startedAt");

ALTER TABLE "CronJobRun" ADD CONSTRAINT "CronJobRun_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
