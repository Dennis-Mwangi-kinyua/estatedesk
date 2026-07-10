import { getAccountingRequestsQueue } from "@/features/accounting-requests/_lib/queries";
import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingSetup } from "./_components/accounting-setup";
import { AccountingWorkspace } from "./_components/accounting-workspace";
import { getAccountingPageData } from "./_lib/queries";
import type { AccountingPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function AccountingPage({ searchParams }: AccountingPageProps) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;

  const resolvedSearchParams = (await searchParams) ?? {};
  const [data, requestsQueue] = await Promise.all([
    getAccountingPageData(orgId),
    getAccountingRequestsQueue(orgId),
  ]);

  if (!data.isInitialized) {
    return <AccountingSetup data={data} />;
  }

  return (
    <AccountingWorkspace
      data={data}
      requestsQueue={requestsQueue}
      orgRole={session.activeOrgRole}
      message={resolvedSearchParams.message}
      activeTab={resolvedSearchParams.tab}
      activeEntry={resolvedSearchParams.entry}
    />
  );
}