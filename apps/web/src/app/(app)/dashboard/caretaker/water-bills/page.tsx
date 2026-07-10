import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { WaterBillsWorkspace } from "@/app/(app)/dashboard/caretaker/water-bills/_components/water-bills-workspace";
import { getCaretakerWaterBillsData } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/queries";

export const dynamic = "force-dynamic";

export default async function WaterBillsPage() {
  const session = await requireCaretakerAccess();

  const data = await getCaretakerWaterBillsData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  return <WaterBillsWorkspace data={data} />;
}