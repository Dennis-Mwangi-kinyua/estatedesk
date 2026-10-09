import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decodePublicId } from "@/lib/public-id";

export async function getPlatformUserDetails(id: string) {
  const userRef = decodePublicId(id, "user");
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: userRef }, { username: userRef }, { slug: userRef }],
      deletedAt: null,
    },
    include: {
      platformPermissions: {
        orderBy: { permission: "asc" },
      },
      memberships: {
        orderBy: { createdAt: "desc" },
        include: {
          org: {
            select: {
              id: true,
              name: true,
              slug: true,
              createdAt: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!user) notFound();

  const grantedPermissions = user.platformPermissions.filter((p) => p.granted);
  const revokedPermissions = user.platformPermissions.filter((p) => !p.granted);
  const isOrphanUser =
    user.memberships.length === 0 && user.platformPermissions.length === 0;
  const archiveConfirmation = user.username || user.email || user.fullName;
  const grantedPermissionSet = new Set(
    user.platformPermissions
      .filter((permission) => permission.granted)
      .map((permission) => permission.permission),
  );

  return {
    user,
    grantedPermissions,
    revokedPermissions,
    isOrphanUser,
    archiveConfirmation,
    grantedPermissionSet,
  };
}
