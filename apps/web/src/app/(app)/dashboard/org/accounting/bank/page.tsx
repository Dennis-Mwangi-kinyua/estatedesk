import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingBankWorkspace } from "../_components/accounting-bank-workspace";
import { AccountingSetup } from "../_components/accounting-setup";
import { AccountingSubNav } from "../_components/accounting-sub-nav";
import { getBankPageData } from "../_lib/bank-queries";
import { getAccountingPageData } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountingBankPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; bankAccountId?: string }>;
}) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const resolvedSearchParams = (await searchParams) ?? {};
  const [setup, data] = await Promise.all([
    getAccountingPageData(orgId),
    getBankPageData(orgId, resolvedSearchParams.bankAccountId),
  ]);

  if (!setup.isInitialized) {
    return <AccountingSetup data={setup} />;
  }

  const assetAccounts = setup.accounts
    .filter((account) => account.type === "ASSET")
    .map((account) => ({
      id: account.id,
      code: account.code,
      name: account.name,
    }));

  return (
    <div className="org-theme-content ed-mobile-first mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <AccountingSubNav />
      <AccountingBankWorkspace
        data={data}
        message={resolvedSearchParams.message}
        bankAccountId={resolvedSearchParams.bankAccountId}
        assetAccounts={assetAccounts}
      />
    </div>
  );
}