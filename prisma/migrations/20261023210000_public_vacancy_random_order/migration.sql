-- Assign each existing and future unit a random, stable browse position.
-- Keep normal indexed LIMIT/OFFSET pagination; never sort by random() per request.
ALTER TABLE "Unit" ADD COLUMN "publicListingRank" DOUBLE PRECISION NOT NULL DEFAULT random();
CREATE INDEX "Unit_isPubliclyListed_status_publicListingRank_id_idx"
ON "Unit"("isPubliclyListed", "status", "publicListingRank", "id");
