import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingPeriodsWorkspace } from "../_components/accounting-periods-workspace";
import { AccountingSetup } from "../_components/accounting-setup";
import { AccountingSubNav } from "../_components/accounting-sub-nav";
import { getPeriodsPageData } from "../_lib/period-queries";
import { getAccountingPageData } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountingPeriodsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const [setup, data] = await Promise.all([
    getAccountingPageData(orgId),
    getPeriodsPageData(orgId),
  ]);
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!setup.isInitialized) {
    return <AccountingSetup data={setup} />;
  }

  return (
    <div className="org-theme-content ed-mobile-first mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <AccountingSubNav />
      <AccountingPeriodsWorkspace data={data} message={resolvedSearchParams.message} />
    </div>
  );
}