import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import type { TenantInvoicePageData } from "../_lib/types";

export function InvoiceHeader({ data }: { data: TenantInvoicePageData }) {
  const { unit } = data;

  return (
    <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Billing Overview
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            Bills &amp; Invoices
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View all your bills in one place, including rent, water, service
            charge, and garbage.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <InAppGuideLink topic="rent" workspace="tenant" />
            <InAppGuideLink topic="water" workspace="tenant" />
          </div>
        </div>

        <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Current Unit
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {unit ? `${unit.property.name} — ${unit.houseNo}` : "N/A"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {unit?.building?.name ?? "No building"}
          </p>
        </div>
      </div>
    </section>
  );
}