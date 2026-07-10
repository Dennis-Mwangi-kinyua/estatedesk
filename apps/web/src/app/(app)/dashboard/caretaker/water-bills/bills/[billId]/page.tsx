import { notFound, redirect } from "next/navigation";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { BillDetailWorkspace } from "./_components/bill-detail-workspace";
import { getCaretakerBillDetailData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId: publicBillId } = await params;
  const session = await requireCaretakerAccess();
  const data = await getCaretakerBillDetailData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    publicBillId,
  });

  if (!data.ok) {
    if (data.notFound) notFound();
    return <BillDetailWorkspace data={data} />;
  }

  if (data.redirectTo) redirect(data.redirectTo);
  return <BillDetailWorkspace data={data} />;
}