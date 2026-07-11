import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerVendorsPageData } from "../_lib/types";
import { QuotePriceCheckPanel } from "./quote-price-check";
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
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <VendorsList data={data} issueId={issueId} />
        <QuotePriceCheckPanel />
      </div>
      <CaretakerWorkspaceFooter note="Vendor directory, dispatch requests, and local price index checks" />
    </div>
  );
}