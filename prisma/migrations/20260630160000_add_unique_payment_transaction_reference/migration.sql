ALTER TABLE "Payment" ADD COLUMN "transactionReferenceKey" TEXT;

-- Preserve existing M-Pesa references in the new uniqueness namespace. If
-- legacy duplicates exist, the earliest record owns the key and later copies
-- remain visible for manual reconciliation without blocking this migration.
WITH ranked AS (
  SELECT
    "id",
    UPPER(REGEXP_REPLACE("externalReference", '[[:space:]]+', '', 'g')) AS normalized_reference,
    ROW_NUMBER() OVER (
      PARTITION BY UPPER(REGEXP_REPLACE("externalReference", '[[:space:]]+', '', 'g'))
      ORDER BY "createdAt", "id"
    ) AS reference_rank
  FROM "Payment"
  WHERE "method" IN ('MPESA_STK', 'MPESA_MANUAL')
    AND "externalReference" IS NOT NULL
    AND BTRIM("externalReference") <> ''
)
UPDATE "Payment" AS payment
SET "transactionReferenceKey" = 'MPESA:' || ranked.normalized_reference
FROM ranked
WHERE payment."id" = ranked."id"
  AND ranked.reference_rank = 1;

CREATE UNIQUE INDEX "Payment_transactionReferenceKey_key"
ON "Payment"("transactionReferenceKey");
