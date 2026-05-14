import { Building2, CalendarDays, Home, ShieldCheck } from "lucide-react";
import { getCurrentTenantWithActiveLease } from "@/lib/tenant/get-current-tenant";
import { getTenantDashboardData } from "@/lib/tenant/get-tenant-dashboard-data";
import { prisma } from "@/lib/prisma";
import { TenantDashboardHero } from "./_components/tenant-dashboard-hero";
import { TenantDashboardStats } from "./_components/tenant-dashboard-stats";
import { TenantDashboardOverview } from "./_components/tenant-dashboard-overview";
import { TenantDashboardQuickActions } from "./_components/tenant-dashboard-quick-actions";
import { TenantDashboardPayments } from "./_components/tenant-dashboard-payments";
import { TenantDashboardUpdates } from "./_components/tenant-dashboard-updates";

export const dynamic = "force-dynamic";

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

export default async function TenantDashboardPage() {
  const tenant = await getCurrentTenantWithActiveLease();

  if (!tenant) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        No tenant profile is linked to your account.
      </div>
    );
  }

  const activeLease = tenant.leases[0];
  const unit = activeLease?.unit;

  if (!activeLease) {
    const history = await prisma.tenantHistoryRecord.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: {
        moveOutDate: "desc",
      },
      take: 12,
      include: {
        org: {
          select: {
            name: true,
          },
        },
      },
    });

    return (
      <div className="space-y-4 sm:space-y-5">
        <section className="ios-panel rounded-[28px] p-4 sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Tenant account
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                No active house linked
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                Your account is still available, but your previous lease has
                been closed. Current property activity is hidden until an
                organization assigns a new house, creates a new tenant profile,
                or completes a profile transfer.
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <HistoryStat icon={Home} label="Active unit" value="None" />
          <HistoryStat
            icon={Building2}
            label="Previous homes"
            value={history.length.toLocaleString()}
          />
          <HistoryStat icon={CalendarDays} label="Account status" value="Retained" />
        </section>

        <section className="ios-panel rounded-[28px] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                Previous houses
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                These are historical tenancy records. They do not expose current
                unit activity after move-out.
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              History
            </span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-5 text-sm text-neutral-500">
                No previous house history has been recorded yet.
              </div>
            ) : (
              history.map((record) => (
                <article
                  key={record.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-950">
                        {record.propertyName ?? record.org.name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Unit {record.unitHouseNo ?? "—"}
                        {record.buildingName ? ` • ${record.buildingName}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                      {record.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <HistoryMiniStat
                      label="Moved out"
                      value={formatDate(record.moveOutDate)}
                    />
                    <HistoryMiniStat
                      label="Monthly rent"
                      value={record.monthlyRent ? formatMoney(record.monthlyRent) : "—"}
                    />
                    <HistoryMiniStat
                      label="Payments"
                      value={record.paymentCount.toLocaleString()}
                    />
                    <HistoryMiniStat
                      label="Total paid"
                      value={formatMoney(record.totalPaid)}
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    );
  }

  const { recentPayments, waterBills, notifications, issues } =
    await getTenantDashboardData(tenant.id, unit?.id);

  const latestWaterBill = waterBills[0];
  const lastPayment = recentPayments[0];
  const openIssuesCount = issues.filter(
    (issue) => issue.status !== "RESOLVED" && issue.status !== "CLOSED"
  ).length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <TenantDashboardHero
        fullName={tenant.fullName}
        propertyName={unit?.property?.name}
        buildingName={unit?.building?.name}
        houseNo={unit?.houseNo}
        leaseStatus={activeLease?.status}
      />

      <TenantDashboardStats
        monthlyRent={activeLease?.monthlyRent}
        dueDay={activeLease?.dueDay}
        latestWaterBill={latestWaterBill}
        lastPayment={lastPayment}
        openIssuesCount={openIssuesCount}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TenantDashboardOverview
          propertyName={unit?.property?.name}
          buildingName={unit?.building?.name}
          houseNo={unit?.houseNo}
          leaseStatus={activeLease?.status}
        />
        <TenantDashboardQuickActions />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TenantDashboardPayments recentPayments={recentPayments} />
        <TenantDashboardUpdates
          notifications={notifications}
          issues={issues}
        />
      </section>
    </div>
  );
}

function HistoryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="ios-card rounded-[24px] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-neutral-950">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
    </div>
  );
}

function HistoryMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200">
      <p className="truncate text-[11px] font-medium text-neutral-500">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-neutral-950">{value}</p>
    </div>
  );
}
