-- Water bill running balances for partial / combined rent+water payments
ALTER TABLE "WaterBill" ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "WaterBill" ADD COLUMN IF NOT EXISTS "balance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Backfill: verified bills are settled; others still owe full total
UPDATE "WaterBill"
SET
  "amountPaid" = CASE
    WHEN "status" = 'PAID_VERIFIED' THEN "total"
    ELSE 0
  END,
  "balance" = CASE
    WHEN "status" = 'PAID_VERIFIED' THEN 0
    WHEN "status" = 'CANCELLED' THEN 0
    ELSE "total"
  END;

-- Combined payment target (rent + water period bill)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'PaymentTargetType'
      AND e.enumlabel = 'COMBINED'
  ) THEN
    ALTER TYPE "PaymentTargetType" ADD VALUE 'COMBINED';
  END IF;
END $$;
