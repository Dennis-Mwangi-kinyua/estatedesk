import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerDocumentsPageData } from "../_lib/types";
import { DocumentsHeader } from "./documents-header";
import { DocumentsList } from "./documents-list";

export function DocumentsWorkspace({
  data,
}: {
  data: CaretakerDocumentsPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <DocumentsHeader data={data} />
      <DocumentsList data={data} />
      <CaretakerWorkspaceFooter note="Document locker for assigned units and tenants" />
    </div>
  );
}