import { BillHistory } from "./bill-history";
import { InvoiceHeader } from "./invoice-header";
import { InvoiceProofForm } from "./invoice-proof-form";
import { InvoiceStats } from "./invoice-stats";
import { formatMoney } from "../_lib/helpers";
import type { TenantInvoicePageData } from "../_lib/types";

const proofNotices: Record<string, string> = {
  "proof-sent": "The proof is with the office. The receipt appears here after they match it.",
  "proof-duplicate": "That reference is already on a payment.",
  "proof-invalid": "Check the month, method, and reference, then send the proof again.",
  "proof-clear": "That month has no balance to attach a proof to.",
  "proof-amount": "Enter an amount up to the balance, or leave it blank.",
  "proof-image": "Use a JPEG, PNG, or WebP image under 5 MB.",
};

export function InvoiceWorkspace({ data, notice }: { data: TenantInvoicePageData; notice?: string }) {
  const openPeriods = new Map<string, number>();
  for (const bill of data.bills) {
    if (bill.isPaid || bill.balance <= 0 || !/^\d{4}-\d{2}$/.test(bill.period)) continue;
    openPeriods.set(bill.period, Math.max(openPeriods.get(bill.period) ?? 0, bill.balance));
  }
  const periods = [...openPeriods.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([period, balance]) => ({ period, balanceLabel: formatMoney(balance) }));
  const message = notice ? proofNotices[notice] : null;
  return (
    <div className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="space-y-4 sm:space-y-6">
          <InvoiceHeader data={data} />
          <InvoiceStats data={data} />
          {message ? <p role="status" className="rounded-[16px] border border-border bg-card px-4 py-3 text-sm">{message}</p> : null}
          {periods.length ? <InvoiceProofForm periods={periods} /> : null}
          <BillHistory
            bills={data.bills}
            totalBilled={data.totalBilled}
            totalBalance={data.totalBalance}
            organizationName={data.organizationName}
            tenantName={data.tenantName}
          />
        </div>
      </div>
    </div>
  );
}