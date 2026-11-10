import "server-only";

import { prisma } from "@/lib/prisma";

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type RateLimitRow = {
  count: number | bigint;
  resetAt: Date;
  databaseNow: Date;
};

export function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  return checkRateLimitWithDatabase(input, prisma);
}

export async function checkRateLimitWithDatabase({
  key,
  limit,
  windowMs,
}: RateLimitInput, db: Pick<typeof prisma, "$queryRaw">): Promise<RateLimitResult> {
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0 || !Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error("Invalid rate limit configuration.");
  }
  // Prisma DateTime columns are UTC timestamps without a time zone. Compare
  // them to UTC database time, not the database session's local timezone or
  // the application host clock. Otherwise a non-UTC host can reset each hit.

  const [bucket] = await db.$queryRaw<RateLimitRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (${key}, 1,
      (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + (${windowMs}::double precision * INTERVAL '1 millisecond'),
      CURRENT_TIMESTAMP AT TIME ZONE 'UTC', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') THEN EXCLUDED."resetAt"
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    RETURNING "count", "resetAt", CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS "databaseNow"
  `;

  if (!bucket || !Number.isFinite(Number(bucket.count)) || !(bucket.resetAt instanceof Date) || !(bucket.databaseNow instanceof Date)) {
    throw new Error("Rate limit storage unavailable.");
  }
  const count = Number(bucket.count);
  const bucketResetAt = bucket.resetAt;
  const now = bucket.databaseNow.getTime();

  if (count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucketResetAt.getTime() - now) / 1000),
      ),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}
