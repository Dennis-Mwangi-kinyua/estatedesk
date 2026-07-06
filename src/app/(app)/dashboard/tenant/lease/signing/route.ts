import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { issuePendingLeaseSigningUrl } from "@/lib/tenant/get-tenant-portal-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  const signerId = new URL(request.url).searchParams.get("signerId");

  if (!signerId) {
    redirect("/dashboard/tenant/lease");
  }

  const signingUrl = await issuePendingLeaseSigningUrl(signerId, session.userId);

  if (!signingUrl) {
    redirect("/dashboard/tenant/lease");
  }

  redirect(signingUrl);
}