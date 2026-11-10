import "server-only";
import { prisma } from "@/lib/prisma";
export const activityInclude = { author: { select: { fullName: true } }, assignee: { select: { fullName: true } } } as const;
export function platformOwners() { return prisma.user.findMany({ where: { deletedAt: null, status: "ACTIVE", platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] } }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }); }
export async function orgOwners(orgId: string) {
  const members = await prisma.membership.findMany({ where: { orgId, employmentEndedAt: null, deactivatedAt: null, scopeType: "ORG", role: { in: ["ADMIN", "MANAGER", "OFFICE"] }, user: { status: "ACTIVE", deletedAt: null } }, select: { user: { select: { id: true, fullName: true } } } });
  return [...new Map(members.map(m => [m.user.id, m.user])).values()];
}
export function pageNumber(value?: string) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? Math.min(n, 100000) : 1; }
