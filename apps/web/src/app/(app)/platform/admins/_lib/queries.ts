import "server-only";
import { unstable_cache } from "next/cache";
import { PlatformRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { adminSelect, type AdminRecord } from "./types";
import { PLATFORM_ADMINS_CACHE_TAG, PLATFORM_ADMINS_CACHE_SECONDS } from "./cache";

const platformAdminWhere: Prisma.UserWhereInput = {
  deletedAt: null,
  OR: [
    {
      platformRole: {
        in: [PlatformRole.PLATFORM_ADMIN, PlatformRole.SUPER_ADMIN],
      },
    },
    { isRootSuperAdmin: true },
    { canCreatePlatformAdmins: true },
  ],
};

async function queryPlatformAdmins(): Promise<AdminRecord[]> {
  return retryTransientDatabaseOperation(
    async () =>
      prisma.user.findMany({
        where: platformAdminWhere,
        orderBy: [
          { isRootSuperAdmin: "desc" },
          { canCreatePlatformAdmins: "desc" },
          { createdAt: "desc" },
        ],
        select: adminSelect,
      }),
    {
      label: "get-platform-admins",
      attempts: 4,
      delayMs: 400,
    },
  );
}

const getCachedPlatformAdmins = unstable_cache(
  queryPlatformAdmins,
  [PLATFORM_ADMINS_CACHE_TAG, "v1"],
  { tags: [PLATFORM_ADMINS_CACHE_TAG], revalidate: PLATFORM_ADMINS_CACHE_SECONDS },
);

// The page must authorize the viewer before calling this display-only query.
export async function getPlatformAdmins(): Promise<AdminRecord[]> {
  const admins = await getCachedPlatformAdmins();
  // The persistent cache serializes dates; restore them for consumers and formatting.
  return admins.map((admin) => ({
    ...admin,
    createdAt: new Date(admin.createdAt),
    emailVerified: admin.emailVerified ? new Date(admin.emailVerified) : null,
    phoneVerified: admin.phoneVerified ? new Date(admin.phoneVerified) : null,
  }));
}

export async function countActivePlatformAdmins(): Promise<number> {
  return retryTransientDatabaseOperation(
    () =>
      prisma.user.count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          OR: [
            {
              platformRole: {
                in: [PlatformRole.PLATFORM_ADMIN, PlatformRole.SUPER_ADMIN],
              },
            },
            { isRootSuperAdmin: true },
          ],
        },
      }),
    {
      label: "count-active-platform-admins",
      attempts: 3,
      delayMs: 300,
    },
  );
}
