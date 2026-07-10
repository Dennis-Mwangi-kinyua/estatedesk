import { formatMoney } from "../_lib/helpers";
import type { TenantInvoicePageData } from "../_lib/types";

export function InvoiceStats({ data }: { data: TenantInvoicePageData }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <div className="rounded-[24px] ed-theme-card border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Tenant
        </p>
        <p className="mt-3 text-[15px] font-semibold text-foreground">
          {data.tenantName}
        </p>
      </div>

      <div className="rounded-[24px] ed-theme-card border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Total Bill
        </p>
        <p className="mt-3 text-[15px] font-semibold text-foreground">
          {formatMoney(data.totalBilled)}
        </p>
      </div>

      <div className="rounded-[24px] ed-theme-card border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Outstanding
        </p>
        <p className="mt-3 text-[15px] font-semibold text-foreground">
          {formatMoney(data.totalBalance)}
        </p>
      </div>

      <div className="rounded-[24px] ed-theme-card border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Rent
        </p>
        <p className="mt-3 text-[15px] font-semibold text-foreground">
          {formatMoney(data.totalRent)}
        </p>
      </div>

      <div className="rounded-[24px] ed-theme-card border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Water
        </p>
        <p className="mt-3 text-[15px] font-semibold text-foreground">
          {formatMoney(data.totalWater)}
        </p>
      </div>

      <div className="rounded-[24px] ed-theme-card border border-border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Service + Garbage
        </p>
        <p className="mt-3 text-[15px] font-semibold text-foreground">
          {formatMoney(data.totalServiceCharge + data.totalGarbage)}
        </p>
      </div>
    </section>
  );
}