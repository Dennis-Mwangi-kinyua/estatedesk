-- Reversal fields were previously appended to an already-applied migration.
-- Preserve that migration's original checksum and record the additions here.
-- Existing databases already containing these fields keep their data intact.
ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'REVERSED';

ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "reversedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reversedByUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "reversalReason" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Payment_reversedByUserId_fkey'
      AND conrelid = '"Payment"'::regclass
  ) THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_reversedByUserId_fkey"
      FOREIGN KEY ("reversedByUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS "Payment_reversedByUserId_reversedAt_idx"
ON "Payment"("reversedByUserId", "reversedAt");
