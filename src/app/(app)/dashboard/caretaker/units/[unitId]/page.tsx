import { notFound, redirect } from "next/navigation";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { UnitDetailWorkspace } from "./_components/unit-detail-workspace";
import { getCaretakerUnitDetailData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function CaretakerUnitDetailPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId: publicUnitId } = await params;
  const session = await requireCaretakerAccess();
  const data = await getCaretakerUnitDetailData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    publicUnitId,
  });

  if (!data.ok) {
    if (data.notFound) notFound();
    return <UnitDetailWorkspace data={data} />;
  }

  if (data.redirectTo) redirect(data.redirectTo);
  return <UnitDetailWorkspace data={data} />;
}