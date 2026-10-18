import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";
import { rolePolicyBlocksPath } from "@/lib/permissions/org-role-policy";
export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const orgId = session.activeOrgId!;
    const [receipts, leases] = await Promise.all([
      rolePolicyBlocksPath(session.orgRolePolicy, "/api/mobile/tenant/payments") ? [] : prisma.receipt.findMany({ where: { payment: { orgId, verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] }, OR: [{ payerUserId: session.userId }, { payerTenant: { userId: session.userId, deletedAt: null } }] } }, select: { id: true, receiptNo: true, issuedAt: true }, orderBy: { issuedAt: "desc" }, take: 100 }),
      rolePolicyBlocksPath(session.orgRolePolicy, "/api/mobile/tenant/leases") ? [] : prisma.lease.findMany({ where: { orgId, deletedAt: null, tenant: { userId: session.userId, deletedAt: null }, contractDocumentId: { not: null } }, select: { id: true, createdAt: true, unit: { select: { houseNo: true, property: { select: { name: true } } } } }, take: 100, orderBy: { createdAt: "desc" } }),
    ]);
    return mobileJson([...receipts.map(r => ({ id: r.id, kind: "receipt", title: `Receipt ${r.receiptNo}`, date: r.issuedAt.toISOString() })), ...leases.map(l => ({ id: l.id, kind: "lease", title: `${l.unit.property.name} / ${l.unit.houseNo} · Lease agreement`, date: l.createdAt.toISOString() }))]);
  }, { role: "TENANT" });
}
