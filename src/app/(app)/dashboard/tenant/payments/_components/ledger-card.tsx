import { SurfaceCard, StatCard } from "@/components/theme/ed-dashboard-shell";
import {
  formatLedgerCurrency,
  formatLedgerDate,
} from "@/lib/ledger";
import { Clock3, ReceiptText, Wallet } from "lucide-react";
import type { TenantPaymentsPageData } from "@/app/(app)/dashboard/tenant/payments/_lib/types";

export function LedgerCard({ data }: { data: TenantPaymentsPageData }) {
  const { tenantLedger } = data;

  if (!tenantLedger.row) {
    return null;
  }

  return (
    <SurfaceCard className="p-4 sm:p-6 xl:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Current month ledger
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
            Balance for {tenantLedger.period}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenantLedger.row.paymentStatus}
            {tenantLedger.row.daysPastDue > 0
              ? ` • ${tenantLedger.row.daysPastDue} days overdue`
              : ""}
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${
            tenantLedger.row.tone === "default"
              ? "border-red-200 bg-red-50 text-red-700"
              : tenantLedger.row.tone === "overdue"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : tenantLedger.row.tone === "settled"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-sky-200 bg-sky-50 text-sky-700"
          }`}
        >
          {tenantLedger.row.paymentStatus}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="Amount due"
          value={formatLedgerCurrency(tenantLedger.row.amountDue)}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Paid"
          value={formatLedgerCurrency(tenantLedger.row.amountPaid)}
        />
        <StatCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Balance"
          value={formatLedgerCurrency(tenantLedger.row.deficit)}
        />
        <StatCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="Oldest due"
          value={formatLedgerDate(tenantLedger.row.oldestDueDate)}
        />
      </div>
    </SurfaceCard>
  );
}