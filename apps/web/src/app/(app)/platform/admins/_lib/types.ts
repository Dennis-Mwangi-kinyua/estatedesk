import type { Prisma } from "@prisma/client";

export const adminSelect = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  phone: true,
  createdAt: true,
  status: true,
  platformRole: true,
  isRootSuperAdmin: true,
  canCreatePlatformAdmins: true,
  emailVerified: true,
  phoneVerified: true,
  platformPermissions: {
    orderBy: { permission: "asc" },
    select: {
      id: true,
      permission: true,
      granted: true,
    },
  },
} satisfies Prisma.UserSelect;

export type AdminRecord = Prisma.UserGetPayload<{
  select: typeof adminSelect;
}>;
