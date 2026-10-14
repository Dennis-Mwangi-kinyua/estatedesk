CREATE TABLE "PlatformUpdateNotice" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "message" VARCHAR(1000) NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "publishedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformUpdateNotice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformUpdateNotice_window_check" CHECK ("endsAt" > "startsAt")
);
