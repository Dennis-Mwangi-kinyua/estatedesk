import { requirePlatformRole } from "@/lib/permissions/guards";
import { SearchWorkspace } from "./_components/search-workspace";
import { getGlobalSearchResults } from "./_lib/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function GlobalSearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const data = await getGlobalSearchResults(q);

  return <SearchWorkspace q={q} data={data} />;
}