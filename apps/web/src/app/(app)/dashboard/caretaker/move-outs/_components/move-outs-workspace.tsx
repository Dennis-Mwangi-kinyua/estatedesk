import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerMoveOutsPageData } from "../_lib/types";
import { MoveOutsHeader } from "./move-outs-header";
import { MoveOutsList } from "./move-outs-list";

export function MoveOutsWorkspace({
  data,
}: {
  data: CaretakerMoveOutsPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <MoveOutsHeader data={data} />
      <MoveOutsList data={data} />
      <CaretakerWorkspaceFooter note="Move-out notices in caretaker scope" />
    </div>
  );
}