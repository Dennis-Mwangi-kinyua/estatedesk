import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { TodayWorkspace } from "./_components/today-workspace";
import { getCaretakerTodayWorkData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function CaretakerTodayWorkPage() {
  const session = await requireCaretakerAccess();

  const data = await getCaretakerTodayWorkData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  return <TodayWorkspace data={data} />;
}