import { requireOrgRole } from "@/lib/permissions/guards";
import { ExpendituresWorkspace } from "./_components/expenditures-workspace";
import { loadOrgExpendituresPageData } from "./_lib/queries";
import type { ExpendituresPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function OrganizationExpendituresPage({
  searchParams,
}: ExpendituresPageProps) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await loadOrgExpendituresPageData(
    session.activeOrgId!,
    Number(resolvedSearchParams.page ?? "1"),
  );

  return (
    <ExpendituresWorkspace
      data={data}
      orgRole={session.activeOrgRole}
      defaultDate={new Date().toISOString().slice(0, 10)}
    />
  );
}