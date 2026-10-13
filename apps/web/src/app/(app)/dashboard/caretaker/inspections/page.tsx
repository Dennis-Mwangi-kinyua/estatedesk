import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { InspectionsWorkspace } from "./_components/inspections-workspace";
import { getCaretakerInspectionsData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function CaretakerInspectionsPage() {
  const session = await requireCaretakerAccess();

  const data = await getCaretakerInspectionsData({
    orgId: session.activeOrgId!,
    userId: session.userId,
    membershipScope: session.membershipScope,
  });

  return <InspectionsWorkspace data={data} />;
}