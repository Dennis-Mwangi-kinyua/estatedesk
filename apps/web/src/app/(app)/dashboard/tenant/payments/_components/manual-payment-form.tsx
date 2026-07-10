import Link from "next/link";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { getCurrentPeriod } from "@/lib/ledger-utils";
import type { TenantPaymentsPageData } from "@/app/(app)/dashboard/tenant/payments/_lib/types";

export function ManualPaymentForm({ data }: { data: TenantPaymentsPageData }) {
  const { activeLease, tenantLedger } = data;

  if (!activeLease) {
    return null;
  }

  const period = tenantLedger.period || getCurrentPeriod();
  const balance = tenantLedger.row?.deficit ?? Number(activeLease.monthlyRent);
  const payHref = `/dashboard/tenant/payments/new?source=period_bill&id=${encodeURIComponent(period)}&amount=${Math.max(Math.round(balance), 1)}`;

  return (
    <SurfaceCard className="p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/65">
            Pay your bill
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
            Instant gateway or manual paste
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/75">
            Choose M-Pesa STK (auto-clears or reduces your rent + water bill) or
            manual M-Pesa / bank (paste the code — pending until your
            organization verifies).
          </p>
        </div>
        <Link
          href={payHref}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Pay now
        </Link>
      </div>
    </SurfaceCard>
  );
}
