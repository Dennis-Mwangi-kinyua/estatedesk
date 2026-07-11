import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingBudgetsWorkspace } from "../_components/accounting-budgets-workspace";
import { AccountingSetup } from "../_components/accounting-setup";
import { AccountingSubNav } from "../_components/accounting-sub-nav";
import { getBudgetsPageData } from "../_lib/budget-queries";
import { getAccountingPageData } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountingBudgetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; budgetId?: string }>;
}) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const resolvedSearchParams = (await searchParams) ?? {};
  const [setup, data] = await Promise.all([
    getAccountingPageData(orgId),
    getBudgetsPageData(orgId, resolvedSearchParams.budgetId),
  ]);

  if (!setup.isInitialized) {
    return <AccountingSetup data={setup} />;
  }

  return (
    <div className="org-theme-content ed-mobile-first mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <AccountingSubNav />
      <AccountingBudgetsWorkspace data={data} message={resolvedSearchParams.message} />
    </div>
  );
}