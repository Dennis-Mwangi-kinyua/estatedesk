import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { PageShell, SurfaceCard, StatCard } from "@/components/theme/ed-dashboard-shell";
import { CalendarDays, Home, Landmark, Wallet } from "lucide-react";
import { formatDate, formatMoney } from "../_lib/helpers";
import type { TenantLeasePageData } from "../_lib/types";
import { LeaseSection } from "./lease-section";

export function LeaseWorkspace({ data }: { data: TenantLeasePageData }) {
  const { tenant, activeLeases, historicalLeases, latestLease } = data;

  if (!tenant || tenant.leases.length === 0) {
    return (
      <PageShell>
        <SurfaceCard className="p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            My Lease
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No lease records found for your account.
          </p>
          <div className="mt-4">
            <InAppGuideLink topic="rent" workspace="tenant" />
          </div>
        </SurfaceCard>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <SurfaceCard className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Lease Overview
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
                My Leases
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                View your active lease, contract information, rent charges, and
                lease history in one place.
              </p>
              <div className="mt-3">
                <InAppGuideLink topic="rent" workspace="tenant" />
              </div>
            </div>

            {latestLease ? (
              <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Current Lease
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {latestLease.unit.property.name} — {latestLease.unit.houseNo}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {latestLease.unit.building?.name ?? "No building"} •{" "}
                  {latestLease.status}
                </p>
              </div>
            ) : null}
          </div>
        </SurfaceCard>

        {latestLease ? (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
            <StatCard
              icon={<Wallet className="h-4 w-4" />}
              label="Monthly Rent"
              value={formatMoney(latestLease.monthlyRent)}
            />
            <StatCard
              icon={<Home className="h-4 w-4" />}
              label="Deposit"
              value={formatMoney(latestLease.deposit)}
            />
            <StatCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Start Date"
              value={formatDate(latestLease.startDate)}
            />
            <StatCard
              icon={<Landmark className="h-4 w-4" />}
              label="Due Day"
              value={`Day ${latestLease.dueDay}`}
            />
          </section>
        ) : null}

        <LeaseSection
          title="Active lease"
          description="Current tenancy records and payment activity."
          leases={activeLeases}
        />

        <LeaseSection
          title="Lease history"
          description="Previous, pending, cancelled, or closed lease records."
          leases={historicalLeases}
        />
      </div>
    </PageShell>
  );
}