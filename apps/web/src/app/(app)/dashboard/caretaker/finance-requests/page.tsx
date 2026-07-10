import { requireOrgRole } from "@/lib/permissions/guards";
import { CaretakerFinanceWorkspace } from "./_components/caretaker-finance-workspace";
import { getCaretakerFinanceRequestsPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ message?: string; focus?: string }>;
};

export default async function CaretakerFinanceRequestsPage({ searchParams }: PageProps) {
  const session = await requireOrgRole(["CARETAKER"]);
  const resolved = (await searchParams) ?? {};

  const result = await getCaretakerFinanceRequestsPageData({
    orgId: session.activeOrgId!,
    userId: session.userId,
    membershipScope: session.membershipScope,
    focusId: resolved.focus,
  });

  return (
    <CaretakerFinanceWorkspace
      result={result}
      message={resolved.message}
      focusId={resolved.focus}
    />
  );
}