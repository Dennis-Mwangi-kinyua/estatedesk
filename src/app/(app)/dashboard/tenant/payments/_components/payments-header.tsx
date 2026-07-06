import Link from "next/link";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import {
  formatDate,
  formatMoney,
  getPaymentTitle,
} from "@/app/(app)/dashboard/tenant/payments/_lib/helpers";
import type { TenantPaymentsPageData } from "@/app/(app)/dashboard/tenant/payments/_lib/types";

export function PaymentsHeader({ data }: { data: TenantPaymentsPageData }) {
  const { latestPayment, activeLease } = data;

  return (
    <SurfaceCard className="p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Payments Overview
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            My Payments
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track your recent rent, water, service charge, and garbage payments
            in one place.
          </p>
        </div>

        {latestPayment ? (
          <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Latest Payment
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {formatMoney(latestPayment.amount)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getPaymentTitle(latestPayment)} •{" "}
              {formatDate(latestPayment.paidAt || latestPayment.createdAt)}
            </p>
          </div>
        ) : null}
      </div>

      {activeLease ? (
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-950">
              Pay rent in advance
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              Cover several future rent months in one payment. The ledger will
              allocate it period by period.
            </p>
          </div>
          <Link
            href={`/dashboard/tenant/payments/checkout?source=advance_rent&id=${activeLease.id}&method=mpesa&months=12&amount=${Number(activeLease.monthlyRent) * 12}`}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Pay 12 months
          </Link>
        </div>
      ) : null}
    </SurfaceCard>
  );
}