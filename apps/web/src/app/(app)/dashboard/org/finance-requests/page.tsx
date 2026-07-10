import { redirect } from "next/navigation";
import { requireOrgRole } from "@/lib/permissions/guards";
import { FinanceRequestsWorkspace } from "@/features/accounting-requests/components/finance-requests-workspace";
import { getFinanceRequestsPageData } from "@/features/accounting-requests/_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ message?: string; focus?: string }>;
};

export default async function OrgFinanceRequestsPage({ searchParams }: PageProps) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"]);

  if (session.activeOrgRole === "ACCOUNTANT") {
    redirect("/dashboard/org/accounting/requests");
  }

  const resolved = (await searchParams) ?? {};

  const data = await getFinanceRequestsPageData({
    orgId: session.activeOrgId!,
    userId: session.userId,
    workspace: "org",
    focusId: resolved.focus,
  });

  return (
    <FinanceRequestsWorkspace
      data={data}
      workspace="org"
      message={resolved.message}
      focusId={resolved.focus}
    />
  );
}