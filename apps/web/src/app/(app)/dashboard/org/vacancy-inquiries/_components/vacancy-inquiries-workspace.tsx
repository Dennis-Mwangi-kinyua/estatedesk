import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { BellRing } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { updateVacancyInquiryStatusAction } from "../actions";
import {
  buildVacancyInquiriesPageHref,
  formatInquiryDate,
  formatInquiryStatus,
  inquiryStatusClasses,
} from "../_lib/helpers";
import type { getVacancyInquiriesPageData } from "../_lib/queries";
import { INQUIRY_STATUSES } from "../_lib/types";

const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

type VacancyInquiriesPageData = Awaited<
  ReturnType<typeof getVacancyInquiriesPageData>
>;

export function VacancyInquiriesWorkspace({
  data,
  orgRole,
}: {
  data: VacancyInquiriesPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={panelShellClassName}>
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <BellRing className="h-3.5 w-3.5" />
                Vacancy leads
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Vacancy inquiries
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Track public vacancy leads, follow up with prospects, and close the
                loop when a unit is filled.
              </p>
              <InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="New" value={data.newCount} highlight={data.newCount > 0} />
            <Stat label="Contacted" value={data.contactedCount} />
            <Stat label="Viewings" value={data.viewingCount} />
            <Stat label="Converted" value={data.convertedCount} />
            <Stat label="Closed" value={data.closedCount} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border px-5 py-4 sm:px-6">
          <FilterLink
            label="All"
            href={buildVacancyInquiriesPageHref(1)}
            active={data.statusFilter === "ALL"}
          />
          {INQUIRY_STATUSES.map((status) => (
            <FilterLink
              key={status}
              label={formatInquiryStatus(status)}
              href={buildVacancyInquiriesPageHref(1, status)}
              active={data.statusFilter === status}
            />
          ))}
        </div>
      </section>

      <section className={panelShellClassName}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-foreground">Inquiry register</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Showing {data.showingFrom}–{data.showingTo} of {data.totalInquiries}
          </p>
        </div>

        {data.inquiries.length === 0 ? (
          <div className="px-5 py-10 text-sm text-muted-foreground sm:px-6">
            No vacancy inquiries match this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/20">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Received
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Prospect
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Message
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Update
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    className="border-b border-border/70 align-top transition hover:bg-muted/10"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatInquiryDate(inquiry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{inquiry.fullName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <a href={`tel:${inquiry.phone}`} className="hover:text-primary">
                          {inquiry.phone}
                        </a>
                        {inquiry.email ? ` · ${inquiry.email}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <DeferredLink
                        href={`/dashboard/org/units/${inquiry.unitId}`}
                        className="font-medium text-foreground transition hover:text-primary"
                      >
                        Unit {inquiry.unit.houseNo}
                      </DeferredLink>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {inquiry.unit.property.name}
                        {inquiry.unit.property.location
                          ? ` · ${inquiry.unit.property.location}`
                          : ""}
                      </p>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">
                      <p className="line-clamp-3">{inquiry.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${inquiryStatusClasses(inquiry.status)}`}
                      >
                        {formatInquiryStatus(inquiry.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={updateVacancyInquiryStatusAction}
                        className="flex min-w-[10rem] flex-col gap-2"
                      >
                        <input type="hidden" name="inquiryId" value={inquiry.id} />
                        <select
                          name="status"
                          defaultValue={inquiry.status}
                          className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                        >
                          {INQUIRY_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {formatInquiryStatus(status)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                          Save status
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-5 py-4 sm:px-6">
            <p className="text-sm text-muted-foreground">
              Page {data.currentPage} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              {data.currentPage > 1 ? (
                <Link
                  href={buildVacancyInquiriesPageHref(
                    data.currentPage - 1,
                    data.statusFilter === "ALL" ? undefined : data.statusFilter,
                  )}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted/20"
                >
                  Previous
                </Link>
              ) : null}
              {data.currentPage < data.totalPages ? (
                <Link
                  href={buildVacancyInquiriesPageHref(
                    data.currentPage + 1,
                    data.statusFilter === "ALL" ? undefined : data.statusFilter,
                  )}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted/20"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          highlight ? "text-amber-700 dark:text-amber-200" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted/20"
      }`}
    >
      {label}
    </Link>
  );
}