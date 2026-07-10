import { Building2, CalendarDays, Home, ShieldCheck } from "lucide-react";
import { StatCard, SurfaceCard, TenantWorkspace } from "@/components/theme/ed-dashboard-shell";
import type { TenantDashboardHistoryRecord } from "../_lib/types";
import { panelShellClassName, SummaryMetric } from "./tenant-dashboard-ui";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function TenantDashboardInactive({
  history,
}: {
  history: TenantDashboardHistoryRecord[];
}) {
  return (
    <TenantWorkspace>
      <section className={panelShellClassName}>
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Account retained
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                No active tenancy
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Your account remains available, but your previous lease has been
                closed. Current property activity is hidden until an organization
                assigns a new unit or completes a profile transfer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<Home className="h-4 w-4" />} label="Active unit" value="None" />
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          label="Previous homes"
          value={history.length.toLocaleString()}
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4" />}
          label="Account status"
          value="Retained"
        />
      </section>

      <SurfaceCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Tenancy history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Historical records from previous homes. Current unit activity is not
              shown after move-out.
            </p>
          </div>
          <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-semibold text-muted-foreground">
            History
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5 text-sm text-muted-foreground">
              No previous house history has been recorded yet.
            </div>
          ) : (
            history.map((record) => (
              <article
                key={record.id}
                className="rounded-2xl border border-border bg-muted/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {record.propertyName ?? record.org.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Unit {record.unitHouseNo ?? "—"}
                      {record.buildingName ? ` • ${record.buildingName}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    {record.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <SummaryMetric
                    label="Moved out"
                    value={formatDate(record.moveOutDate)}
                  />
                  <SummaryMetric
                    label="Monthly rent"
                    value={record.monthlyRent ? formatMoney(record.monthlyRent) : "—"}
                  />
                  <SummaryMetric
                    label="Payments"
                    value={record.paymentCount.toLocaleString()}
                  />
                  <SummaryMetric
                    label="Total paid"
                    value={formatMoney(record.totalPaid)}
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </SurfaceCard>
    </TenantWorkspace>
  );
}