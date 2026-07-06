import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { SearchWorkspace } from "./_components/search-workspace";
import { getCaretakerSearchResults } from "./_lib/queries";
import type { SearchPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function CaretakerSearchPage({
  searchParams,
}: SearchPageProps) {
  const session = await requireCaretakerAccess();
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim();

  const data = await getCaretakerSearchResults({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    q,
  });

  return <SearchWorkspace q={q} data={data} />;
}