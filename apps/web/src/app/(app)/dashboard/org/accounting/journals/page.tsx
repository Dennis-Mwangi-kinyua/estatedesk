import type { AccountingJournalStatus, AccountingSourceType } from "@prisma/client";
import { getJournalRegister } from "@/lib/accounting/journal-queries";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingJournalsWorkspace } from "../_components/accounting-journals-workspace";
import { AccountingSetup } from "../_components/accounting-setup";
import { AccountingSubNav } from "../_components/accounting-sub-nav";
import { getAccountingPageData } from "../_lib/queries";

export const dynamic = "force-dynamic";

export default async function AccountingJournalsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    message?: string;
    q?: string;
    status?: string;
    sourceType?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAccountingPageData(orgId);

  if (!data.isInitialized) {
    return <AccountingSetup data={data} />;
  }

  const page = Number(resolvedSearchParams.page ?? "1");
  const register = await getJournalRegister(prisma, orgId, {
    q: resolvedSearchParams.q,
    status: resolvedSearchParams.status as AccountingJournalStatus | undefined,
    sourceType: resolvedSearchParams.sourceType as AccountingSourceType | undefined,
    from: resolvedSearchParams.from ? new Date(resolvedSearchParams.from) : undefined,
    to: resolvedSearchParams.to ? new Date(resolvedSearchParams.to) : undefined,
    page: Number.isFinite(page) ? page : 1,
  });

  return (
    <div className="org-theme-content ed-mobile-first mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <AccountingSubNav />
      <AccountingJournalsWorkspace
        data={data}
        register={register}
        message={resolvedSearchParams.message}
        filters={{
          q: resolvedSearchParams.q,
          status: resolvedSearchParams.status,
          sourceType: resolvedSearchParams.sourceType,
          from: resolvedSearchParams.from,
          to: resolvedSearchParams.to,
          page: register.page,
        }}
      />
    </div>
  );
}