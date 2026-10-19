import { prisma } from "@/lib/prisma";
import { nativeRoute } from "@/lib/mobile/route";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { mobileJson } from "@/lib/mobile/api";
import { inspectionPhotos } from "@/lib/mobile/inspection-photos";
import { readAssetBytes } from "@/lib/storage/read-asset-bytes";
import { validateImageBytes } from "@/lib/uploads/secure-image";

export async function GET(request: Request, { params }: { params: Promise<{ inspectionId: string; assetId: string }> }) {
  return nativeRoute(request, async session => {
    if (!await nativeTenantSection(session, "/dashboard/tenant/inspections")) return mobileJson({ error: "Inspection access is unavailable." }, 403);
    const { inspectionId, assetId } = await params;
    const inspection = await prisma.inspection.findFirst({ where: { id: inspectionId, notice: { tenant: { userId: session.userId, orgId: session.activeOrgId!, deletedAt: null }, lease: { orgId: session.activeOrgId! } } }, select: { checklist: true, notice: { select: { lease: { select: { unitId: true } } } } } });
    if (!inspection || !inspectionPhotos(inspection.checklist).some(photo => photo.id === assetId)) return mobileJson({ error: "Photo unavailable." }, 404);
    const asset = await prisma.asset.findFirst({ where: { id: assetId, orgId: session.activeOrgId!, unitId: inspection.notice.lease.unitId, deletedAt: null }, select: { key: true, mimeType: true, size: true } });
    if (!asset || !asset.mimeType || !["image/png", "image/jpeg", "image/webp"].includes(asset.mimeType) || asset.size > 2 * 1024 * 1024) return mobileJson({ error: "Photo unavailable." }, 404);
    const image = validateImageBytes(await readAssetBytes(asset.key), { maxBytes: 2 * 1024 * 1024 });
    return mobileJson({ dataUri: `data:${image.mimeType};base64,${image.buffer.toString("base64")}` });
  }, { role: "TENANT" });
}
