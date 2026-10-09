import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { readRefundProof } from "@/lib/move-outs/refund-proof";
import { validateImageBytes } from "@/lib/uploads/secure-image";
export async function GET(_request: Request, { params }: { params: Promise<{ noticeId: string }> }) {
  const session = await requireUserSession();
  const { noticeId } = await params;
  const notice = await prisma.moveOutNotice.findUnique({ where: { id: noticeId }, include: { tenant: true, lease: true } });
  if (!notice) return new NextResponse("Not found", { status: 404 });
  if (notice.tenant.userId !== session.userId) {
    const manager = await requireManagementAccess();
    if (manager.activeOrgId !== notice.lease.orgId) return new NextResponse("Not found", { status: 404 });
  }
  const closeout = notice.closeout;
  if (!closeout || typeof closeout !== "object" || Array.isArray(closeout) || typeof closeout.refundProofAssetId !== "string") return new NextResponse("Not found", { status: 404 });
  const asset = await prisma.asset.findFirst({ where: { id: closeout.refundProofAssetId, orgId: notice.lease.orgId, deletedAt: null } });
  if (!asset) return new NextResponse("Not found", { status: 404 });
  const image = validateImageBytes(await readRefundProof(asset));
  return new NextResponse(new Uint8Array(image.buffer), { headers: { "Content-Type": image.mimeType, "Content-Disposition": "attachment; filename=refund-proof", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
