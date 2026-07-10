import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingCoaWorkspace } from "../_components/accounting-coa-workspace";
import { AccountingSetup } from "../_components/accounting-setup";
import { AccountingSubNav } from "../_components/accounting-sub-nav";
import { getChartOfAccountsPageData } from "../_lib/coa-queries";
import { getAccountingPageData } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountingCoaPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const [setup, data] = await Promise.all([
    getAccountingPageData(orgId),
    getChartOfAccountsPageData(orgId),
  ]);
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!setup.isInitialized) {
    return <AccountingSetup data={setup} />;
  }

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <AccountingSubNav />
      <AccountingCoaWorkspace data={data} message={resolvedSearchParams.message} />
    </div>
  );
}