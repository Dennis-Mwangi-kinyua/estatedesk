import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminSelect, type AdminRecord } from "./types";

export async function getPlatformAdmins(): Promise<AdminRecord[]> {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { platformRole: PlatformRole.PLATFORM_ADMIN },
        { platformRole: PlatformRole.SUPER_ADMIN },
        { isRootSuperAdmin: true },
        { canCreatePlatformAdmins: true },
      ],
    },
    orderBy: [
      { isRootSuperAdmin: "desc" },
      { canCreatePlatformAdmins: "desc" },
      { createdAt: "desc" },
    ],
    select: adminSelect,
  });
}


