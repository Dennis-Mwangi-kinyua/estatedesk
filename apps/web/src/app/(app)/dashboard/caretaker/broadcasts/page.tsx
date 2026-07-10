import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { BroadcastsWorkspace } from "./_components/broadcasts-workspace";
import { getCaretakerBroadcastsData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function CaretakerBroadcastsPage({ searchParams }: PageProps) {
  const session = await requireCaretakerAccess();
  const resolved = (await searchParams) ?? {};

  const data = await getCaretakerBroadcastsData({
    orgId: session.activeOrgId!,
    userId: session.userId,
    page: Number(resolved.page ?? "1"),
  });

  return <BroadcastsWorkspace data={data} />;
}