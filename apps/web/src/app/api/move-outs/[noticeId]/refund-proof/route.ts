import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { moveOutDocumentWhere } from "@/lib/move-outs/document-access";
import { readRefundProof } from "@/lib/move-outs/refund-proof";
import { validateImageBytes } from "@/lib/uploads/secure-image";
export async function GET(_request: Request, { params }: { params: Promise<{ noticeId: string }> }) {
  const session = await requireUserSession();
  const { noticeId } = await params;
  const where = moveOutDocumentWhere(session, noticeId);
  if (!where) return new NextResponse("Not found", { status: 404 });
  const notice = await prisma.moveOutNotice.findFirst({ where, include: { tenant: true, lease: true } });
  if (!notice) return new NextResponse("Not found", { status: 404 });

  const closeout = notice.closeout;
  if (!closeout || typeof closeout !== "object" || Array.isArray(closeout) || typeof closeout.refundProofAssetId !== "string") return new NextResponse("Not found", { status: 404 });
  const asset = await prisma.asset.findFirst({ where: { id: closeout.refundProofAssetId, orgId: notice.lease.orgId, unitId: notice.lease.unitId, deletedAt: null, metadata: { path: ["noticeId"], equals: notice.id } } });
  if (!asset) return new NextResponse("Not found", { status: 404 });
  const image = validateImageBytes(await readRefundProof(asset));
  return new NextResponse(new Uint8Array(image.buffer), { headers: { "Content-Type": image.mimeType, "Content-Disposition": "attachment; filename=refund-proof", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
