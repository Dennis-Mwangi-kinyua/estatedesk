import { PlatformPermissionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PERMISSION_TYPES = Object.values(PlatformPermissionType);

export async function getAdminPermissionsPageData() {
  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
    },
    orderBy: [{ platformRole: "asc" }, { fullName: "asc" }],
    include: {
      platformPermissions: true,
    },
  });

  const explicitGrants = admins.reduce(
    (sum, admin) =>
      sum + admin.platformPermissions.filter((permission) => permission.granted).length,
    0,
  );

  return {
    admins,
    explicitGrants,
    rootAdmins: admins.filter((admin) => admin.isRootSuperAdmin).length,
  };
}