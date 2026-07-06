import { BillHistory } from "./bill-history";
import { InvoiceHeader } from "./invoice-header";
import { InvoiceStats } from "./invoice-stats";
import type { TenantInvoicePageData } from "../_lib/types";

export function InvoiceWorkspace({ data }: { data: TenantInvoicePageData }) {
  return (
    <div className="ed-theme-page min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="space-y-4 sm:space-y-6">
          <InvoiceHeader data={data} />
          <InvoiceStats data={data} />
          <BillHistory
            bills={data.bills}
            totalBilled={data.totalBilled}
            totalBalance={data.totalBalance}
          />
        </div>
      </div>
    </div>
  );
}