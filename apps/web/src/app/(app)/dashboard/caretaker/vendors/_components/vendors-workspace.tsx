import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerVendorsPageData } from "../_lib/types";
import { VendorsHeader } from "./vendors-header";
import { VendorsList } from "./vendors-list";

export function VendorsWorkspace({
  data,
  issueId,
}: {
  data: CaretakerVendorsPageData;
  issueId?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <VendorsHeader data={data} />
      <VendorsList data={data} issueId={issueId} />
      <CaretakerWorkspaceFooter note="Vendor directory and dispatch requests" />
    </div>
  );
}