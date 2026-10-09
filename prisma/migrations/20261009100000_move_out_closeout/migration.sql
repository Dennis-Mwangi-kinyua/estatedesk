ALTER TABLE "MoveOutNotice"
ADD COLUMN "actualMoveOutDate" TIMESTAMP(3),
ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "closeout" JSONB;
