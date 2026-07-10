import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { ReadWorkspace } from "./_components/read-workspace";
import { getCaretakerMeterReadData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ period?: string }>;
};

export default async function ReadWaterBillsPage({ searchParams }: PageProps) {
  const session = await requireCaretakerAccess();
  const resolved = (await searchParams) ?? {};

  const data = await getCaretakerMeterReadData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    period: resolved.period,
  });

  return <ReadWorkspace data={data} />;
}