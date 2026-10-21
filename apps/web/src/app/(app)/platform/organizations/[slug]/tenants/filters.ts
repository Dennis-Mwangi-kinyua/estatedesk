import type { Prisma } from "@prisma/client";
import { TenantStatus } from "@prisma/client";
export function readPage(raw?: string) {
  const number = Number(raw);
  return Number.isSafeInteger(number) && number > 0 ? Math.min(number, 100000) : 1;
}
export function directoryFilters(orgId: string, query: { q?: string; status?: string }) {
  const q = (query.q ?? "").trim().slice(0, 150);
  const status = Object.values(TenantStatus).find(value => value === query.status);
  const where: Prisma.TenantWhereInput = { orgId, deletedAt: null, ...(status ? { status } : {}),
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { companyName: { contains: q, mode: "insensitive" } }] } : {}) };
  return { q, status: status ?? "", where };
}
export function tenantAuditFilter(orgId: string, tenantId: string, userId: string | null): Prisma.AuditLogWhereInput {
  return { orgId, OR: [{ entityType: "Tenant", entityId: tenantId }, ...(userId ? [{ actorUserId: userId }] : [])] };
}
