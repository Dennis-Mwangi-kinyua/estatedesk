-- Support global notification queue dispatch and platform jobs/admin pages.
CREATE INDEX IF NOT EXISTS "Notification_status_createdAt_idx"
  ON "Notification"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "KraSubmissionAttempt_outcome_attemptedAt_idx"
  ON "KraSubmissionAttempt"("outcome", "attemptedAt");

CREATE INDEX IF NOT EXISTS "CronJobRun_startedAt_idx"
  ON "CronJobRun"("startedAt");
