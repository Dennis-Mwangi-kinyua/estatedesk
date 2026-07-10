import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { UnitsWorkspace } from "./_components/units-workspace";
import { getCaretakerUnitsData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string; page?: string }>;
};

export default async function CaretakerUnitsPage({ searchParams }: PageProps) {
  const session = await requireCaretakerAccess();
  const resolved = (await searchParams) ?? {};

  const data = await getCaretakerUnitsData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    page: Number(resolved.page ?? "1"),
    query: resolved.q,
  });

  return <UnitsWorkspace data={data} />;
}