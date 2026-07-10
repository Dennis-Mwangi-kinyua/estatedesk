import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerWaterBillsData } from "../_lib/types";
import {
  WaterBillsApprovalSection,
  WaterBillsIssuedSection,
  WaterBillsPendingSection,
} from "./water-bills-sections";
import { WaterBillsHeader } from "./water-bills-header";
import { WaterBillsSidebar } from "./water-bills-sidebar";
import { WaterBillsStats } from "./water-bills-stats";

export function WaterBillsWorkspace({ data }: { data: CaretakerWaterBillsData }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <WaterBillsHeader data={data} />
      <WaterBillsStats data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <WaterBillsPendingSection data={data} />
          <WaterBillsApprovalSection data={data} />
          <WaterBillsIssuedSection data={data} />
        </div>

        <WaterBillsSidebar />
      </div>

      <CaretakerWorkspaceFooter note="Water billing workflow for assigned units" />
    </div>
  );
}