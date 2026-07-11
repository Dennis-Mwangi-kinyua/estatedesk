import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingReportsWorkspace } from "../_components/accounting-reports-workspace";
import { AccountingSetup } from "../_components/accounting-setup";
import { AccountingSubNav } from "../_components/accounting-sub-nav";
import { getAccountingPageData } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountingReportsPage() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const data = await getAccountingPageData(orgId);

  if (!data.isInitialized) {
    return <AccountingSetup data={data} />;
  }

  return (
    <div className="org-theme-content ed-mobile-first mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <AccountingSubNav />
      <AccountingReportsWorkspace data={data} />
    </div>
  );
}