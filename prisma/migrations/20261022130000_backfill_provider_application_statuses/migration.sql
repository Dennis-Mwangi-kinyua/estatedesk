-- Reconcile legacy applications without overwriting explicit review decisions.
UPDATE "JobApplication" AS application
SET "status" = CASE
  WHEN job."status" = 'CANCELLED' THEN 'CANCELLED'::"JobApplicationStatus"
  WHEN job."providerId" = application."providerId" THEN 'SELECTED'::"JobApplicationStatus"
  ELSE 'DECLINED'::"JobApplicationStatus"
END,
"reviewNote" = CASE
  WHEN job."status" = 'CANCELLED' THEN 'The organisation cancelled this job.'
  WHEN job."providerId" = application."providerId" THEN 'The organisation selected you for this job.'
  ELSE 'Another provider was selected for this job.'
END,
"updatedAt" = CURRENT_TIMESTAMP
FROM "ServiceJob" AS job
WHERE application."jobId" = job."id"
  AND job."status" <> 'OPEN'
  AND application."status" IN ('PENDING', 'REVIEWING');
