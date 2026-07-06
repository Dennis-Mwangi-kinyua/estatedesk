import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { HandoverWorkspace } from "./_components/handover-workspace";
import { getCaretakerHandoverData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function CaretakerHandoverPage() {
  const session = await requireCaretakerAccess();

  const data = await getCaretakerHandoverData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  return <HandoverWorkspace data={data} />;
}