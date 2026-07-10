import { requireTenantAccess } from "@/lib/permissions/guards";
import { ExpendituresWorkspace } from "./_components/expenditures-workspace";
import { loadTenantExpendituresPageData } from "./_lib/queries";
import type { ExpendituresPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function TenantExpendituresPage({
  searchParams,
}: ExpendituresPageProps) {
  const session = await requireTenantAccess();
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await loadTenantExpendituresPageData({
    orgId: session.activeOrgId!,
    userId: session.userId,
    page: Number(resolvedSearchParams.page ?? "1"),
  });

  if (!data) {
    return <main className="p-6">Tenant profile not found.</main>;
  }

  return <ExpendituresWorkspace data={data} />;
}