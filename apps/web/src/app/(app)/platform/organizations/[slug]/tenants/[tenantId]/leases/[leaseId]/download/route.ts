import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { getPlatformOrganization } from "../../../../queries";
import { decodePublicId } from "@/lib/public-id";
import { prisma } from "@/lib/prisma";
import { readAssetBytes } from "@/lib/storage/read-asset-bytes";
import { writePlatformAuditLog } from "@/lib/audit/security";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; tenantId: string; leaseId: string }> }) {
  const { slug, tenantId, leaseId } = await params;
  const { org, session } = await getPlatformOrganization(slug);
  const lease = await prisma.lease.findFirst({ where: { id: decodePublicId(leaseId, "lease"), orgId: org.id, tenantId: decodePublicId(tenantId, "tenant"), deletedAt: null, tenant: { orgId: org.id, deletedAt: null } }, include: { contractDocument: true } });
  if (!lease?.contractDocument || lease.contractDocument.deletedAt || lease.contractDocument.orgId !== org.id) notFound();
  const bytes = await readAssetBytes(lease.contractDocument.key);
  if (Buffer.from(bytes).subarray(0, 5).toString() !== "%PDF-") return new Response("Agreement is not a PDF.", { status: 415 });
  const fingerprint = createHash("sha256").update(bytes).digest("hex");
  const completed = await prisma.leaseSignatureEnvelope.findFirst({ where: { leaseId: lease.id, orgId: org.id, finalAssetId: lease.contractDocumentId, status: "COMPLETED" }, select: { finalDocumentHash: true } });
  if (completed && completed.finalDocumentHash !== fingerprint) return new Response("Agreement integrity check failed.", { status: 409 });
  await writePlatformAuditLog({ actorUserId: session.userId, action: "DOCUMENT_DOWNLOADED", entityType: "Lease", entityId: lease.id, metadata: { orgId: org.id, tenantId: lease.tenantId, fingerprint } });
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="tenancy-agreement.pdf"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Document-SHA256": fingerprint } });
}
