ALTER TABLE "BnbListing"
  ADD COLUMN "latitude" DECIMAL(10,7),
  ADD COLUMN "longitude" DECIMAL(10,7);

ALTER TABLE "BnbListing"
  ADD CONSTRAINT "BnbListing_coordinates_check"
  CHECK (
    ("latitude" IS NULL AND "longitude" IS NULL)
    OR (
      "latitude" IS NOT NULL
      AND "longitude" IS NOT NULL
      AND
      "latitude" BETWEEN -90 AND 90
      AND "longitude" BETWEEN -180 AND 180
    )
  );
