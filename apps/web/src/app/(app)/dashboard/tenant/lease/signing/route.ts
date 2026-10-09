import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { issuePendingLeaseSigningUrl } from "@/lib/tenant/get-tenant-portal-context";
import { decodePublicId } from "@/lib/public-id";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  const signerRef = new URL(request.url).searchParams.get("signerId");
  const signerId = signerRef ? decodePublicId(signerRef, "lease-signer") : null;

  if (!signerId) {
    redirect("/dashboard/tenant/lease");
  }

  const signingUrl = await issuePendingLeaseSigningUrl(signerId, session.userId);

  if (!signingUrl) {
    redirect("/dashboard/tenant/lease");
  }

  redirect(signingUrl);
}
