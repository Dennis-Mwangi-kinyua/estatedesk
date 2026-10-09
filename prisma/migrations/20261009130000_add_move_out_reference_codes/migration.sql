ALTER TABLE "MoveOutNotice" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;
ALTER TABLE "Inspection" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;

UPDATE "MoveOutNotice" AS notice
SET "referenceCode" = 'ESDSK-' || (
  SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1), '' ORDER BY digits.position)
  FROM generate_series(1, 10) AS digits(position)
  WHERE notice.id IS NOT NULL
)
WHERE notice."referenceCode" IS NULL;

UPDATE "Inspection" AS inspection
SET "referenceCode" = 'ESDSK-' || (
  SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1), '' ORDER BY digits.position)
  FROM generate_series(1, 10) AS digits(position)
  WHERE inspection.id IS NOT NULL
)
WHERE inspection."referenceCode" IS NULL;

ALTER TABLE "MoveOutNotice" ALTER COLUMN "referenceCode" SET NOT NULL;
ALTER TABLE "Inspection" ALTER COLUMN "referenceCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "MoveOutNotice_referenceCode_key"
  ON "MoveOutNotice"("referenceCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Inspection_referenceCode_key"
  ON "Inspection"("referenceCode");
