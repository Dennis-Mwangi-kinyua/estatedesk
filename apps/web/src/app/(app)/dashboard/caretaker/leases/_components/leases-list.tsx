import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  Home,
  Phone,
  Users,
} from "lucide-react";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { ListPagination } from "@/app/(app)/dashboard/caretaker/_components/list-pagination";
import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  buildLeasesPageHref,
  formatCurrency,
  formatDate,
  phoneHref,
  statusClasses,
} from "../_lib/helpers";
import { ErrorStateCard } from "@/app/(app)/dashboard/caretaker/issues/_components/issues-ui";
import type { CaretakerLeasesPageData } from "../_lib/types";

export function LeasesList({ data }: { data: CaretakerLeasesPageData }) {
  const { leases, totalLeases, currentPage, totalPages, showingFrom, showingTo } =
    data;

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Lease board"
        title="Assigned leases"
        action={
          <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
            {totalLeases} total
          </span>
        }
      />

      <div className="space-y-4 p-4 sm:p-5">
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : leases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background">
              <Home className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              No leases found
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Nothing is linked to your assigned apartments yet.
            </p>
            <div className="mt-4">
              <InAppGuideLink topic="caretaker" workspace="caretaker" />
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {leases.map((lease) => {
                const rent =
                  lease.monthlyRent != null
                    ? formatCurrency(lease.monthlyRent)
                    : lease.unit?.rentAmount != null
                      ? formatCurrency(lease.unit.rentAmount)
                      : "—";
                const tenantPhoneHref = phoneHref(lease.tenant?.phone);

                return (
                  <article
                    key={lease.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-foreground">
                          {lease.tenant?.fullName ?? "Unassigned tenant"}
                        </p>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                          <Home className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {[
                              lease.unit?.property?.name,
                              lease.unit?.building?.name,
                              lease.unit?.houseNo
                                ? `Unit ${lease.unit.houseNo}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" / ") || "No unit"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClasses(
                          lease.status,
                        )}`}
                      >
                        {lease.status.toLowerCase()}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-border bg-muted/10 p-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <Banknote className="h-3.5 w-3.5" />
                          Rent
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-foreground">
                          {rent}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-muted/10 p-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          Phone
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-foreground">
                          {lease.tenant?.phone ?? "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/10 px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a
                        href={tenantPhoneHref ?? undefined}
                        aria-disabled={!tenantPhoneHref}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold ${
                          tenantPhoneHref
                            ? "bg-primary text-primary-foreground"
                            : "pointer-events-none bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call tenant
                      </a>
                      <Link
                        href="/dashboard/caretaker/tenants"
                        className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Tenant list
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-border bg-muted/20">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Tenant</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Property</th>
                      <th className="px-4 py-3 font-medium">Building</th>
                      <th className="px-4 py-3 font-medium">Unit</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Monthly rent</th>
                      <th className="px-4 py-3 font-medium">Start</th>
                      <th className="px-4 py-3 font-medium">End</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {leases.map((lease) => (
                      <tr key={lease.id}>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {lease.tenant?.fullName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {lease.tenant?.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {lease.unit?.property?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {lease.unit?.building?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {lease.unit?.houseNo ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs capitalize ${statusClasses(
                              lease.status,
                            )}`}
                          >
                            {lease.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {lease.monthlyRent != null
                            ? formatCurrency(lease.monthlyRent)
                            : lease.unit?.rentAmount != null
                              ? formatCurrency(lease.unit.rentAmount)
                              : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(lease.startDate)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(lease.endDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {data.ok ? (
      <div className="border-t border-border p-4 sm:p-5">
        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          showingFrom={showingFrom}
          showingTo={showingTo}
          totalItems={totalLeases}
          buildHref={buildLeasesPageHref}
        />
      </div>
      ) : null}
    </section>
  );
}