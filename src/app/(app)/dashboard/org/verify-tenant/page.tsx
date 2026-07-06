import { requireUserSession } from "@/lib/auth/session";
import { loadVerifyTenantPageData } from "./_lib/queries";
import type { VerifyTenantPageProps } from "./_lib/types";
import { VerifyTenantWorkspace } from "./_components/verify-tenant-workspace";

export const dynamic = "force-dynamic";

export default async function VerifyTenantPage({ searchParams }: VerifyTenantPageProps) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No active organisation found for your account.
      </div>
    );
  }

  if (session.activeOrgRole !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Only organisation admins can verify tenants.
      </div>
    );
  }

  const params = searchParams ? await searchParams : {};
  const data = await loadVerifyTenantPageData(session.activeOrgId, params);

  return (
    <VerifyTenantWorkspace
      data={data}
      activeOrgId={session.activeOrgId}
      orgRole={session.activeOrgRole}
    />
  );
}