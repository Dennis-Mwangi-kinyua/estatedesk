import { requireOrgRole } from "@/lib/permissions/guards";
import { AccountingRequestsReviewWorkspace } from "@/features/accounting-requests/components/accounting-requests-review-workspace";
import { getAccountingRequestsReviewPageData } from "@/features/accounting-requests/_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ message?: string; focus?: string }>;
};

export default async function AccountingRequestsPage({ searchParams }: PageProps) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const resolved = (await searchParams) ?? {};

  const data = await getAccountingRequestsReviewPageData(session.activeOrgId!);

  return (
    <AccountingRequestsReviewWorkspace
      data={data}
      message={resolved.message}
      focusId={resolved.focus}
    />
  );
}