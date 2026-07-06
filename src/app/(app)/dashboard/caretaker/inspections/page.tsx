import { requireUserSession } from "@/lib/auth/session";
import { InspectionsWorkspace } from "./_components/inspections-workspace";
import { getCaretakerInspectionsData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function CaretakerInspectionsPage() {
  const session = await requireUserSession();

  const data = await getCaretakerInspectionsData({
    orgId: session.activeOrgId!,
    userId: session.userId,
  });

  return <InspectionsWorkspace data={data} />;
}