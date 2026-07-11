import { PlatformRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { adminSelect, type AdminRecord } from "./types";

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

export async function getPlatformAdmins(): Promise<AdminRecord[]> {
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
