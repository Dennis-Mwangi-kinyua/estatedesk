import { PlatformRole, Prisma, UserStatus } from "@prisma/client";
import { ROLE_VALUES, STATUS_VALUES } from "./constants";

export function getInitials(name: string | null | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.slice(0, 1).toUpperCase() ?? "U";
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function parseRole(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return ROLE_VALUES.find((role) => role === normalized) ?? null;
}

export function parseStatus(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return STATUS_VALUES.find((status) => status === normalized) ?? null;
}

export function formatPermission(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildWhere({
  q,
  role,
  status,
}: {
  q: string;
  role: PlatformRole | null;
  status: UserStatus | null;
}): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (role) where.platformRole = role;
  if (status) where.status = status;

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}


