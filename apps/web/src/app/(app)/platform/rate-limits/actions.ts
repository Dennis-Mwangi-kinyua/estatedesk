"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";

const PAGE_PATH = "/platform/rate-limits";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function resetRateLimitBucketAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const key = readString(formData, "key");
  if (!key) return;

  const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });
  if (!existing) return;

  await prisma.rateLimitBucket.delete({ where: { key } });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_RATE_LIMIT_BUCKET_RESET",
    entityType: "RateLimitBucket",
    entityId: key,
    metadata: {
      previousCount: existing.count,
      previousResetAt: existing.resetAt.toISOString(),
    },
  });

  revalidatePath(PAGE_PATH);
}

export async function clearExpiredRateLimitBucketsAction() {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const result = await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lte: new Date() } },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_RATE_LIMIT_EXPIRED_CLEARED",
    entityType: "RateLimitBucket",
    entityId: "expired",
    metadata: { deletedCount: result.count },
  });

  revalidatePath(PAGE_PATH);
}

export async function clearRateLimitScopeAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const scope = readString(formData, "scope");
  if (!scope) return;

  // Match keys that start with "scope:" (our bucket key convention).
  const buckets = await prisma.rateLimitBucket.findMany({
    where: { key: { startsWith: `${scope}:` } },
    select: { key: true },
    take: 5000,
  });

  if (buckets.length === 0) {
    // Also allow exact scope prefix without colon for odd keys.
    const loose = await prisma.rateLimitBucket.findMany({
      where: { key: { startsWith: scope } },
      select: { key: true },
      take: 5000,
    });

    if (loose.length === 0) return;

    await prisma.rateLimitBucket.deleteMany({
      where: { key: { in: loose.map((item) => item.key) } },
    });

    await writePlatformAuditLog({
      actorUserId: session.userId,
      action: "PLATFORM_RATE_LIMIT_SCOPE_CLEARED",
      entityType: "RateLimitBucket",
      entityId: scope,
      metadata: { deletedCount: loose.length, match: "prefix" },
    });

    revalidatePath(PAGE_PATH);
    return;
  }

  await prisma.rateLimitBucket.deleteMany({
    where: { key: { in: buckets.map((item) => item.key) } },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_RATE_LIMIT_SCOPE_CLEARED",
    entityType: "RateLimitBucket",
    entityId: scope,
    metadata: { deletedCount: buckets.length, match: "scope:" },
  });

  revalidatePath(PAGE_PATH);
}
