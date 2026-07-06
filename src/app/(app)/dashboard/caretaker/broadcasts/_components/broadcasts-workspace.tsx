import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerBroadcastsPageData } from "../_lib/types";
import { BroadcastsHeader } from "./broadcasts-header";
import { BroadcastsList } from "./broadcasts-list";

export function BroadcastsWorkspace({
  data,
}: {
  data: CaretakerBroadcastsPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <BroadcastsHeader data={data} />
      <BroadcastsList data={data} />
      <CaretakerWorkspaceFooter note="Office broadcast messages for caretakers" />
    </div>
  );
}