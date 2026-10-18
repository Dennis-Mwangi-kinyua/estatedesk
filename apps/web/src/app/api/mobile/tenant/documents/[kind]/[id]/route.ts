import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";
import { rolePolicyBlocksPath } from "@/lib/permissions/org-role-policy";
import { GET as receiptDownload } from "@/lib/documents/receipt-download-route";
import { downloadLeaseAgreement } from "@/lib/documents/lease-download";
export async function GET(request: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  return nativeRoute(request, async session => {
    const { kind, id } = await context.params;
    if (!["receipt", "lease"].includes(kind) || id.length > 200) return mobileJson({ error: "Document not found." }, 404);
    if (rolePolicyBlocksPath(session.orgRolePolicy, kind === "receipt" ? "/api/mobile/tenant/payments" : "/api/mobile/tenant/leases")) return mobileJson({ error: "Document access is disabled." }, 403);
    const owns = kind === "receipt" ? await prisma.receipt.findFirst({ where: { id, payment: { orgId: session.activeOrgId!, verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] }, OR: [{ payerUserId: session.userId }, { payerTenant: { userId: session.userId, deletedAt: null } }] } }, select: { id: true } }) : await prisma.lease.findFirst({ where: { id, orgId: session.activeOrgId!, deletedAt: null, tenant: { userId: session.userId, deletedAt: null } }, select: { id: true } });
    if (!owns) return mobileJson({ error: "Document not found." }, 404);
    return kind === "receipt" ? receiptDownload(request, { params: Promise.resolve({ receiptId: id }) }) : downloadLeaseAgreement(request, id, session);
  }, { role: "TENANT" });
}
