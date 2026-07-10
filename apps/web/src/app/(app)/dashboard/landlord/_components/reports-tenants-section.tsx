import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  Receipt,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import {
  formatCurrency,
  formatPercent,
} from "@/app/(app)/dashboard/landlord/_lib/helpers";
import {
  PaymentReportList,
  PropertyMiniStat,
  ReportTile,
} from "@/app/(app)/dashboard/landlord/_components/landlord-ui";
import type { LandlordDashboardData } from "@/app/(app)/dashboard/landlord/_lib/types";

export function ReportsTenantsSection({
  data,
}: {
  data: LandlordDashboardData;
}) {
  return (
    <section id="reports" className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="ios-panel overflow-hidden rounded-[28px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Reports
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
              Portfolio snapshot
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Current period: {data.currentPeriod}. See expected income,
              received rent, balances, and tenant payment status across every
              linked property.
            </p>
          </div>

          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
            <BarChart3 className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ReportTile
            label="Mapped Rent"
            value={formatCurrency(data.monthlyRent)}
            detail={`${formatPercent(data.occupancyRate)} occupied · ${data.vacantUnits} vacant`}
            icon={TrendingUp}
          />
          <ReportTile
            label="Expected This Month"
            value={formatCurrency(data.monthlyAmountDue)}
            detail={`${data.tenantNames.length} active tenant${
              data.tenantNames.length === 1 ? "" : "s"
            }`}
            icon={UserRoundCheck}
          />
          <ReportTile
            label="Paid This Month"
            value={formatCurrency(data.monthlyAmountPaid)}
            detail={`${data.paidUnits.length} tenant${
              data.paidUnits.length === 1 ? "" : "s"
            } paid in full`}
            icon={Receipt}
          />
          <ReportTile
            label="Outstanding"
            value={formatCurrency(data.monthlyBalance)}
            detail={`${data.unpaidUnits.length} tenant${
              data.unpaidUnits.length === 1 ? "" : "s"
            } not fully paid`}
            icon={Home}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ReportTile
            label="Collection Rate"
            value={formatPercent(data.collectionRate)}
            detail={`${formatCurrency(data.monthlyAmountPaid)} collected this period`}
            icon={BarChart3}
          />
          <ReportTile
            label="Occupied Rent"
            value={formatCurrency(data.occupiedRent)}
            detail={`${data.occupiedUnits} occupied unit${
              data.occupiedUnits === 1 ? "" : "s"
            }`}
            icon={Users}
          />
          <ReportTile
            label="Vacancy Exposure"
            value={formatCurrency(data.vacantRent)}
            detail={`${data.vacantUnits} vacant unit${
              data.vacantUnits === 1 ? "" : "s"
            }`}
            icon={Building2}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <PaymentReportList
            title="Paid"
            emptyText="No tenants are fully paid for this period yet."
            units={data.paidUnits}
          />
          <PaymentReportList
            title="Not paid"
            emptyText="No unpaid tenant balances for this period."
            units={data.unpaidUnits}
          />
        </div>

        <div className="mt-4 rounded-[24px] border border-neutral-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-950">
                Rent report
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {data.strongestProperty
                  ? `${data.strongestProperty.name} leads with ${formatCurrency(
                      data.strongestProperty.rent,
                    )} across ${data.strongestProperty.units} unit${
                      data.strongestProperty.units === 1 ? "" : "s"
                    }. Occupied rent is ${formatCurrency(
                      data.occupiedRent,
                    )}; average unit rent is ${formatCurrency(data.averageRent)}.`
                  : "No rent report is available yet."}
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                Vacancy value
              </p>
              <p className="mt-1 text-base font-bold text-neutral-950">
                {formatCurrency(data.vacantRent)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-950">
                Property reports
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Breakdown for every property linked to this landlord.
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              {data.propertyReports.length} linked
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {data.propertyReports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-semibold text-neutral-950">
                    {report.name}
                  </p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
                    {report.paidCount}/{report.paidCount + report.unpaidCount}{" "}
                    paid
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <PropertyMiniStat
                    label="Expected"
                    value={formatCurrency(report.expected)}
                  />
                  <PropertyMiniStat
                    label="Paid"
                    value={formatCurrency(report.paid)}
                  />
                  <PropertyMiniStat
                    label="Balance"
                    value={formatCurrency(report.balance)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside id="tenants" className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Tenants
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
              Linked names
            </h2>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <ClipboardList className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {data.tenantNames.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
              Tenant names will appear here once occupied units have active
              leases.
            </div>
          ) : (
            data.tenantNames.slice(0, 8).map((tenantName) => (
              <div
                key={tenantName}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-xs font-bold text-white">
                  {tenantName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("") || "T"}
                </span>
                <p className="min-w-0 truncate text-sm font-semibold text-neutral-950">
                  {tenantName}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>
    </section>
  );
}