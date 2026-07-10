import { notFound } from "next/navigation";
import { getAccountLedgerPage } from "@/lib/accounting/journal-queries";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingAccountWorkspace } from "../../_components/accounting-account-workspace";
import { AccountingSetup } from "../../_components/accounting-setup";
import { AccountingSubNav } from "../../_components/accounting-sub-nav";
import { getAccountingPageData } from "../../_lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountingAccountPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const { accountId } = await params;
  const data = await getAccountingPageData(orgId);

  if (!data.isInitialized) {
    return <AccountingSetup data={data} />;
  }

  const ledger = await getAccountLedgerPage(prisma, orgId, accountId);
  if (!ledger) {
    notFound();
  }

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <AccountingSubNav />
      <AccountingAccountWorkspace data={ledger} currencyCode={data.org.currencyCode} />
    </div>
  );
}