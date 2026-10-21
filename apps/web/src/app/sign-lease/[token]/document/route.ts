import { createHash } from "node:crypto";
import { getUserSession } from "@/lib/auth/session";
import { getLeaseSigningContext } from "@/lib/leases/signing";
import { prisma } from "@/lib/prisma";
import { readAssetBytes } from "@/lib/storage/read-asset-bytes";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getUserSession();
  if (!session) return new Response("Sign in to view this agreement.", { status: 401 });
  const { token } = await params;
  const signer = await getLeaseSigningContext(token);
  if (!signer || signer.userId !== session.userId) return new Response("Agreement not found.", { status: 404 });
  const completed = signer.envelope.status === "COMPLETED";
  const assetId = completed ? signer.envelope.finalAssetId : signer.envelope.sourceAssetId;
  if (!assetId) return new Response("Agreement not available.", { status: 404 });
  const asset = await prisma.asset.findFirst({ where: { id: assetId, orgId: signer.envelope.orgId, deletedAt: null } });
  if (!asset) return new Response("Agreement not found.", { status: 404 });
  const bytes = await readAssetBytes(asset.key);
  const expectedHash = completed ? signer.envelope.finalDocumentHash : signer.envelope.sourceDocumentHash;
  if (!expectedHash || createHash("sha256").update(bytes).digest("hex") !== expectedHash) return new Response("Agreement integrity check failed.", { status: 409 });
  const attachment = new URL(request.url).searchParams.get("download") === "1";
  return new Response(Buffer.from(bytes), { headers: {
    "Content-Type": "application/pdf", "Content-Disposition": `${attachment ? "attachment" : "inline"}; filename="${completed ? "signed-tenancy-agreement" : "tenancy-agreement"}.pdf"`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}
