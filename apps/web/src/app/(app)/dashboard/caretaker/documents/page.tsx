import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { DocumentsWorkspace } from "./_components/documents-workspace";
import { getCaretakerDocumentsData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function CaretakerDocumentsPage() {
  const session = await requireCaretakerAccess();

  const data = await getCaretakerDocumentsData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
  });

  return <DocumentsWorkspace data={data} />;
}