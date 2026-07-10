import { requireUserSession } from "@/lib/auth/session";
import { loadTenantDetailsData } from "./_lib/queries";
import type { TenantDetailsPageProps } from "./_lib/types";
import { TenantDetailsWorkspace } from "./_components/tenant-details-workspace";

export const dynamic = "force-dynamic";

export default async function TenantDetailsPage({ params }: TenantDetailsPageProps) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No active organisation found for your account.
      </div>
    );
  }

  if (
    !session.activeOrgRole ||
    !["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.activeOrgRole)
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        You do not have permission to view tenant details.
      </div>
    );
  }

  const { tenantId } = await params;
  const data = await loadTenantDetailsData(
    String(session.activeOrgId).trim(),
    tenantId,
    session.activeOrgRole,
  );

  return <TenantDetailsWorkspace data={data} orgRole={session.activeOrgRole} />;
}