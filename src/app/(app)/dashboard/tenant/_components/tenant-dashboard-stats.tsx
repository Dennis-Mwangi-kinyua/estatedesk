import { formatCurrency, formatDate } from "@/lib/tenant/tenant-format";

type TenantDashboardStatsProps = {
  monthlyRent?: unknown;
  dueDay?: number | null;
  latestWaterBill?: {
    total?: unknown;
    period?: string | null;
  };
  lastPayment?: {
    amount?: unknown;
    createdAt?: Date | null;
    paidAt?: Date | null;
  };
  openIssuesCount: number;
};

export function TenantDashboardStats({
  monthlyRent,
  dueDay,
  latestWaterBill,
  lastPayment,
  openIssuesCount,
}: TenantDashboardStatsProps) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div className="rounded-[26px] border border-neutral-200/80 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">Monthly Rent</p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          {formatCurrency(monthlyRent as never)}
        </p>
        <p className="mt-1 text-xs text-neutral-500">📅 Due day {dueDay ?? "—"}</p>
      </div>

      <div className="rounded-[26px] border border-neutral-200/80 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">Water Bill</p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          {formatCurrency(latestWaterBill?.total as never)}
        </p>
        <p className="mt-1 text-xs text-neutral-500">💧 {latestWaterBill?.period ?? "No recent bill"}</p>
      </div>

      <div className="rounded-[26px] border border-neutral-200/80 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">Last Payment</p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          {formatCurrency(lastPayment?.amount as never)}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          ✅ {lastPayment ? formatDate(lastPayment.paidAt ?? lastPayment.createdAt) : "No payment yet"}
        </p>
      </div>

      <div className="rounded-[26px] border border-neutral-200/80 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">Open Issues</p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          {openIssuesCount}
        </p>
        <p className="mt-1 text-xs text-neutral-500">🧰 Requests in progress</p>
      </div>
    </section>
  );
}