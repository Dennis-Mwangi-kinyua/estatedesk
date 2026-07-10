import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { MoveOutsWorkspace } from "./_components/move-outs-workspace";
import { getCaretakerMoveOutsData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function CaretakerMoveOutsPage() {
  const session = await requireCaretakerAccess();

  const data = await getCaretakerMoveOutsData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  return <MoveOutsWorkspace data={data} />;
}