import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { WaterBillsSidebar } from "@/app/(app)/dashboard/caretaker/water-bills/_components/water-bills-sidebar";
import type { CaretakerBillDetailPageData } from "../_lib/types";
import { BillDetailHeader } from "./bill-detail-header";
import { BillDetailPayments } from "./bill-detail-payments";
import { BillDetailStats } from "./bill-detail-stats";

export function BillDetailWorkspace({
  data,
}: {
  data: CaretakerBillDetailPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!data.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load water bill"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <BillDetailHeader data={data} />

          <div className="min-w-0 space-y-5">
            <div className="space-y-5">
              <BillDetailStats data={data} />
              <BillDetailPayments data={data} />
            </div>

            <WaterBillsSidebar />
          </div>
        </>
      )}

      <CaretakerWorkspaceFooter note="Tenant water bill detail for assigned units" />
    </div>
  );
}