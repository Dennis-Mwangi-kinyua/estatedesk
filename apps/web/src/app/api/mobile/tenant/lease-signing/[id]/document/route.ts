import { rolePolicyBlocksPath } from "@/lib/permissions/org-role-policy";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { nativeRoute } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { readAssetBytes } from "@/lib/storage/read-asset-bytes";
import { recordLeaseSignatureView } from "@/lib/leases/signing";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return nativeRoute(request, async session => {
    if (rolePolicyBlocksPath(session.orgRolePolicy, "/api/mobile/tenant/leases") || !await nativeTenantSection(session, "/dashboard/tenant/lease")) return mobileJson({ error: "Lease access is unavailable." }, 403);
    const { id } = await context.params;
    const signer = await prisma.leaseSignatureSigner.findFirst({ where: { id, userId: session.userId, envelope: { orgId: session.activeOrgId!, lease: { deletedAt: null, tenant: { userId: session.userId, deletedAt: null } } } }, select: { id: true, envelopeId: true, envelope: { select: { sourceAssetId: true, sourceDocumentHash: true } } } });
    if (!signer) return mobileJson({ error: "Signing document not found." }, 404);
    const asset = await prisma.asset.findFirst({ where: { id: signer.envelope.sourceAssetId, orgId: session.activeOrgId! }, select: { key: true } });
    if (!asset) return mobileJson({ error: "Signing document not found." }, 404);
    const bytes = await readAssetBytes(asset.key);
    if (createHash("sha256").update(bytes).digest("hex") !== signer.envelope.sourceDocumentHash) return mobileJson({ error: "The lease document has changed. Ask management for a new signing request." }, 409);
    await recordLeaseSignatureView(signer.id, signer.envelopeId, request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(), request.headers.get("user-agent"));
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="lease-to-sign.pdf"', "Cache-Control": "no-store" } });
  }, { role: "TENANT" });
}
