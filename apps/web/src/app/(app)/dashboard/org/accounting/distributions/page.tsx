import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingDistributionsWorkspace } from "../_components/accounting-distributions-workspace";
import { AccountingSetup } from "../_components/accounting-setup";
import { AccountingSubNav } from "../_components/accounting-sub-nav";
import { getDistributionsPageData } from "../_lib/distribution-queries";
import { getOwnerStatementPageData } from "../_lib/owner-statement-queries";
import { getAccountingPageData } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountingDistributionsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    message?: string;
    landlordId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const resolvedSearchParams = (await searchParams) ?? {};
  const [setup, data, statementData] = await Promise.all([
    getAccountingPageData(orgId),
    getDistributionsPageData(orgId),
    getOwnerStatementPageData(orgId, {
      landlordId: resolvedSearchParams.landlordId,
      from: resolvedSearchParams.from,
      to: resolvedSearchParams.to,
    }),
  ]);

  if (!setup.isInitialized) {
    return <AccountingSetup data={setup} />;
  }

  return (
    <div className="org-theme-content ed-mobile-first mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <AccountingSubNav />
      <AccountingDistributionsWorkspace
        data={data}
        statementData={statementData}
        message={resolvedSearchParams.message}
      />
    </div>
  );
}