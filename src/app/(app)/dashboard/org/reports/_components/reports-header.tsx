import Link from "next/link";
import { ArrowLeft, BarChart3, Download } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import type { OrgRole } from "@prisma/client";
import { formatPercent } from "../_lib/helpers";
import type { ReportsPageData } from "../_lib/types";

function formatPeriodLabel(period: string) {
  const [year, month] = period.split("-");
  if (!year || !month) return period;

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });
}

export function ReportsHeader({
  data,
  orgRole,
}: {
  data: ReportsPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              Reports
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Rent collection report
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Review who has paid, who is partial or unpaid, and which tenants consistently pay
              early for <span className="font-medium text-foreground">{formatPeriodLabel(data.period)}</span>.
            </p>

            <InAppGuideHint topic="rent" workspace="org" orgRole={orgRole} />

            <p className="mt-3 text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{data.activePaymentFilter.label.toLowerCase()}</span>{" "}
              for{" "}
              <span className="font-medium text-foreground">
                {data.selectedApartment === "all"
                  ? "all apartments"
                  : data.selectedApartment}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <Link
              href="/dashboard/org/payments"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Tenant ledger
            </Link>
            <Link
              href={`/api/org/reports/export?type=rent-roll&period=${data.period}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Export rent roll
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-end sm:px-6">
        <form action="/dashboard/org/reports" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {data.selectedApartment !== "all" ? (
            <input type="hidden" name="apartment" value={data.selectedApartment} />
          ) : null}
          {data.selectedPayment !== "all" ? (
            <input type="hidden" name="payment" value={data.selectedPayment} />
          ) : null}
          <div className="min-w-0 flex-1">
            <label htmlFor="period" className="text-sm font-semibold text-foreground">
              Reporting period
            </label>
            <input
              id="period"
              type="month"
              name="period"
              defaultValue={data.period}
              className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted/30"
          >
            Apply period
          </button>
        </form>

        <div className="rounded-2xl border border-border bg-muted/15 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Collection rate
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatPercent(data.collectionRate)}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(data.collectionRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}