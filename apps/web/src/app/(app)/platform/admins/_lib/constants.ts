import { PlatformPermissionType } from "@prisma/client";

export const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

export const ALL_PLATFORM_PERMISSIONS = Object.values(PlatformPermissionType);
