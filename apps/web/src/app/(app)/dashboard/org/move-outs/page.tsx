import { requireManagementAccess } from "@/lib/permissions/guards";
import { MoveOutsWorkspace } from "@/app/(app)/move-outs/_components/move-outs-workspace";
import { getMoveOutsPageData } from "@/app/(app)/move-outs/_lib/queries";
import type { MoveOutsPageProps } from "@/app/(app)/move-outs/_lib/types";

export const dynamic = "force-dynamic";

export default async function OrgMoveOutsPage({ searchParams }: MoveOutsPageProps) {
  const session = await requireManagementAccess();
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getMoveOutsPageData(
    session,
    Number(resolvedSearchParams.page ?? "1"),
  );

  return <MoveOutsWorkspace {...data} variant="org" />;
}