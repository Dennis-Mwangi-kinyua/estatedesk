import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingSettingsWorkspace } from "../_components/accounting-settings-workspace";
import { AccountingSubNav } from "../_components/accounting-sub-nav";
import { getAccountingPageData } from "../_lib/queries";
import { AccountingSetup } from "../_components/accounting-setup";

export const dynamic = "force-dynamic";

export default async function AccountingSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string }>;
}) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const data = await getAccountingPageData(orgId);
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!data.isInitialized) {
    return <AccountingSetup data={data} />;
  }

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <AccountingSubNav />
      <AccountingSettingsWorkspace
        data={data}
        message={resolvedSearchParams.message}
      />
    </div>
  );
}