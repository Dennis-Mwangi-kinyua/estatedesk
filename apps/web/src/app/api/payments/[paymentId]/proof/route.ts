import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { paymentProofWhere } from "@/lib/payments/proof-access";
import { validatedPaymentProof } from "@/lib/payments/proof";

export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await requireUserSession();
  const { paymentId } = await params;
  const missing = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const where = paymentProofWhere(session, paymentId);
  if (!where) return missing();
  const payment = await prisma.payment.findFirst({ where });
  if (!payment) return missing();
  const raw = payment.callbackRaw;
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || typeof raw.proofAssetId !== "string") return missing();
  const asset = await prisma.asset.findFirst({ where: { id: raw.proofAssetId, orgId: payment.orgId, deletedAt: null, metadata: { path: ["paymentId"], equals: payment.id } } });
  if (!asset) return missing();
  const image = await validatedPaymentProof(asset);
  return new Response(new Uint8Array(image.buffer), { headers: { "Content-Type": image.mimeType, "Content-Disposition": `attachment; filename="payment-proof${image.extension}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
