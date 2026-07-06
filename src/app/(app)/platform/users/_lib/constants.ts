import { PlatformPermissionType, PlatformRole, UserStatus } from "@prisma/client";

export const ROLE_VALUES = Object.values(PlatformRole);
export const STATUS_VALUES = Object.values(UserStatus);
export const PLATFORM_PERMISSION_VALUES = Object.values(PlatformPermissionType);

export const PLATFORM_ROLE_META = {
  USER: {
    title: "Platform User",
    description:
      "Standard account. Access depends on organization membership or tenant/landlord mapping.",
  },
  PLATFORM_ADMIN: {
    title: "Platform Admin",
    description:
      "Can operate the control plane according to granted platform permissions.",
  },
  SUPER_ADMIN: {
    title: "Super Admin",
    description:
      "Highest platform role. Use for trusted system owners only.",
  },
} satisfies Record<PlatformRole, { title: string; description: string }>;

export const CREATE_ERROR_MESSAGES: Record<string, string> = {
  missing: "Full name, username, and email are required.",
  username: "Username must be 3-30 characters using letters, numbers, dots, underscores, or hyphens.",
  password: "Password must be at least 8 characters and both password fields must match.",
  duplicate: "A user with the same username, email, or phone already exists.",
  "super-admin": "Only a super admin can create another super admin.",
};
