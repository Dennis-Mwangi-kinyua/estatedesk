import Link from "next/link";
import { LayoutGrid, Home, Users } from "lucide-react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { SectionCard, DASHBOARD_QUICK_LINKS } from "./org-dashboard-shared";

export function OrgDashboardHero({
  data,
}: {
  data: OrgDashboardSummary;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-7">
        <SectionCard className="overflow-hidden border-neutral-200 bg-white">
          <div className="p-6 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Portfolio overview
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  Welcome back
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
                  Track occupancy, teams, payments, maintenance, and tenant
                  operations from one well-structured workspace.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Occupancy
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-950">
                    {data.occupancyRate}%
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    Pending payments
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-950">
                    {data.pendingPayments}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {DASHBOARD_QUICK_LINKS.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 transition hover:border-neutral-300 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {item.description}
                      </p>
                    </div>
                    <item.icon className="h-4 w-4 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-700" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="xl:col-span-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Link
            href="/dashboard/org/tenants"
            className="group block rounded-3xl border border-neutral-200 bg-white p-5 text-neutral-950 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">Tenant operations</h3>
                <p className="mt-1.5 text-sm leading-6 text-neutral-500">
                  Review tenants, active leases, occupancy, and customer records
                  from one place.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/org/issues"
            className="group block rounded-3xl border border-neutral-900 bg-neutral-950 p-5 text-white transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Home className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">Maintenance desk</h3>
                <p className="mt-1.5 text-sm leading-6 text-neutral-300">
                  Track open issues, urgent repairs, and daily building
                  operations.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}