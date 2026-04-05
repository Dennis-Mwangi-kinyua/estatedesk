import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import type { StaffRole } from "@/features/staff/constants/role-meta";

export async function getRoleMembers(role: StaffRole) {
  const orgId = await requireCurrentOrgId();

  return prisma.membership.findMany({
    where: {
      orgId,
      role,
      org: { deletedAt: null },
      user: { deletedAt: null },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      role: true,
      scopeType: true,
      scopeId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });
}