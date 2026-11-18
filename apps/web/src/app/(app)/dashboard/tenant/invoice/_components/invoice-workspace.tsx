import Link from "@/components/navigation/workspace-link";
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

const invoiceFilters = [
  { id: "all", label: "All" },
  { id: "unpaid", label: "Unpaid" },
  { id: "partial", label: "Partially paid" },
  { id: "paid", label: "Paid" },
  { id: "awaiting-approval", label: "Awaiting approval" },
] as const;

export function InvoiceWorkspace({ data, notice, status }: {
  data: TenantInvoicePageData;
  notice?: string;
  status?: string | string[];
}) {
  const filter = invoiceFilters.find(({ id }) => id === status)?.id ?? "all";
  const bills = data.bills.filter((bill) => {
    switch (filter) {
      case "unpaid": return !bill.isPaid && bill.balance > 0 && !bill.amountPaid;
      case "partial": return !bill.isPaid && bill.balance > 0 && (bill.amountPaid ?? 0) > 0;
      case "paid": return bill.isPaid;
      case "awaiting-approval": return bill.rawStatus === "PENDING APPROVAL";
      default: return true;
    }
  });
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
          <Link href="/dashboard/tenant/invoice/archive" className="inline-flex min-h-11 items-center text-sm text-primary underline">Browse invoice archive</Link>
          <InvoiceStats data={data} />
          {message ? <p role="status" className="rounded-[16px] border border-border bg-card px-4 py-3 text-sm">{message}</p> : null}
          {periods.length ? <InvoiceProofForm periods={periods} /> : null}
          <nav aria-label="Invoice status" className="flex flex-wrap gap-2">
            {invoiceFilters.map(({ id, label }) => (
              <Link
                key={id}
                href={id === "all" ? "/dashboard/tenant/invoice" : `/dashboard/tenant/invoice?status=${id}`}
                aria-current={id === filter ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-3 text-sm font-medium aria-[current=page]:border-primary aria-[current=page]:text-primary"
              >
                {label}
              </Link>
            ))}
          </nav>
          <BillHistory
            bills={bills}
            filtered={filter !== "all"}
            organizationName={data.organizationName}
            tenantName={data.tenantName}
          />
        </div>
      </div>
    </div>
  );
}