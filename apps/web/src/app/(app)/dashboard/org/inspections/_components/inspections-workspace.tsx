import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { CalendarDays, ClipboardCheck, Clock3, MapPin, UserRound } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { encodePublicId } from "@/lib/public-id";
import type { getOrgInspectionsPageData } from "../_lib/queries";

const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function statusClasses(status: string, isOverdue: boolean) {
  if (isOverdue) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
  }

  switch (status) {
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "CANCELLED":
      return "border-border bg-muted/30 text-muted-foreground";
    default:
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
  }
}

type InspectionsPageData = Awaited<ReturnType<typeof getOrgInspectionsPageData>>;

export function InspectionsWorkspace({
  data,
  orgRole,
}: {
  data: InspectionsPageData;
  orgRole?: OrgRole | null;
}) {
  // Request-time comparison for overdue flags (server component).
  // eslint-disable-next-line react-hooks/purity -- intentional request clock
  const now = Date.now();

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <nav aria-label="Move-out workspace" className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">
        <Link href="/dashboard/org/move-outs" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-muted/50 px-4 text-sm font-semibold text-foreground">Move-out notices</Link>
        <Link href="/dashboard/org/inspections" aria-current="page" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><CalendarDays className="size-4" />Inspection schedule</Link>
      </nav>
      <section className={panelShellClassName}>
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Move-out inspections
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Inspections
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Review scheduled and completed move-out inspections across the
                portfolio.
              </p>
              <InAppGuideHint topic="moveOut" workspace="org" orgRole={orgRole} />
            </div>
            <Link data-workspace-action="true"
              href="/dashboard/org/move-outs"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              Open move-out queue
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4 sm:px-6 sm:py-5">
          <Stat label="Total" value={data.totalInspections} />
          <Stat label="Scheduled" value={data.scheduledCount} />
          <Stat
            label="Overdue"
            value={data.overdueCount}
            highlight={data.overdueCount > 0}
          />
          <Stat label="Completed" value={data.completedCount} />
        </div>
      </section>

      <section className={panelShellClassName}>
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-foreground">Inspection register</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Showing {data.showingFrom}–{data.showingTo} of {data.totalInspections}
          </p>
        </div>

        {data.inspections.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="size-6" /></span>
            <h3 className="mt-4 font-semibold text-foreground">Your inspection schedule is clear</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Schedule an inspection from a move-out notice and it will appear here with its time, inspector, and status.</p>
            <Link href="/dashboard/org/move-outs" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Review move-out notices</Link>
          </div>
        ) : (
          <>
          <div className="grid gap-3 bg-muted/10 p-3 sm:p-4 2xl:hidden">
            {data.inspections.map((inspection) => {
              const isOverdue = inspection.status === "SCHEDULED" && inspection.scheduledAt.getTime() < now;
              const unit = inspection.notice.lease.unit;
              return <article key={inspection.id} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{formatDateTime(inspection.scheduledAt)}</p><DeferredLink href={`/dashboard/org/inspections/${encodePublicId(inspection.id, "inspection")}`} className="mt-1 block break-words text-base font-semibold text-foreground hover:text-primary">{inspection.notice.tenant.fullName}</DeferredLink></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(inspection.status, isOverdue)}`}>{isOverdue ? "Overdue" : inspection.status.toLowerCase()}</span></div>
                <div className="mt-4 grid gap-2 border-t border-border pt-3 text-sm text-muted-foreground"><p className="flex min-w-0 items-center gap-2"><MapPin className="size-4 shrink-0" /><span className="break-words">{unit.property.name} · Unit {unit.houseNo}</span></p><p className="flex items-center gap-2"><UserRound className="size-4 shrink-0" />{inspection.inspector.fullName}</p><p className="flex items-center gap-2"><Clock3 className="size-4 shrink-0" />Move-out {formatDate(inspection.notice.moveOutDate)}</p></div>
                <DeferredLink href={`/dashboard/org/inspections/${encodePublicId(inspection.id, "inspection")}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-primary">Open inspection</DeferredLink>
              </article>;
            })}
          </div>
          <div className="hidden overflow-x-auto 2xl:block">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="border-b border-border bg-muted/20">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Scheduled
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Tenant / unit
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Inspector
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Move-out
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.inspections.map((inspection) => {
                  const isOverdue =
                    inspection.status === "SCHEDULED" &&
                    inspection.scheduledAt.getTime() < now;
                  const unit = inspection.notice.lease.unit;

                  return (
                    <tr
                      key={inspection.id}
                      className="border-b border-border/70 transition hover:bg-muted/10"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(inspection.scheduledAt)}
                      </td>
                      <td className="px-4 py-3">
                        <DeferredLink
                          href={`/dashboard/org/inspections/${encodePublicId(inspection.id, "inspection")}`}
                          className="font-medium text-foreground transition hover:text-primary"
                        >
                          {inspection.notice.tenant.fullName}
                        </DeferredLink>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {unit.property.name} · Unit {unit.houseNo}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inspection.inspector.fullName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(inspection.status, isOverdue)}`}
                        >
                          {isOverdue ? "Overdue" : inspection.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(inspection.notice.moveOutDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></>
        )}

        {data.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-5 py-4 sm:px-6">
            <p className="text-sm text-muted-foreground">
              Page {data.currentPage} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              {data.currentPage > 1 ? (
                <Link
                  href={
                    data.currentPage - 1 <= 1
                      ? "/dashboard/org/inspections"
                      : `/dashboard/org/inspections?page=${data.currentPage - 1}`
                  }
                  className="rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted/20"
                >
                  Previous
                </Link>
              ) : null}
              {data.currentPage < data.totalPages ? (
                <Link
                  href={`/dashboard/org/inspections?page=${data.currentPage + 1}`}
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
