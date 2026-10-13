import Link from "@/components/navigation/workspace-link";
import type { ReactNode } from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import { CalendarDays, CircleCheck as CheckCircle2, ClipboardList, House as Home, LogOut, UsersRound as Users } from "@/components/shared/colored-icons";
import { DeferredLink } from "@/components/navigation/app-links";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { encodePublicId } from "@/lib/public-id";
import { formatDate, formatDateTime } from "../_lib/helpers";
import type { MoveOutsPageData } from "../_lib/types";
import { MoveOutsPagination } from "./move-outs-pagination";

const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

const statusLabel: Record<string, string> = {
  SUBMITTED: "Submitted",
  INSPECTION_SCHEDULED: "Inspection scheduled",
  INSPECTION_COMPLETED: "Inspection complete",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export type MoveOutsWorkspaceProps = MoveOutsPageData & {
  variant?: "org" | "legacy";
};

export function MoveOutsWorkspace({
  variant = "org",
  ...props
}: MoveOutsWorkspaceProps) {
  const {
    session,
    notices,
    totalNotices,
    submittedCount,
    scheduledCount,
    completedCount,
    closedCount,
    currentPage,
    totalPages,
    showingFrom,
    showingTo,
  } = props;

  const isOrg = variant === "org";
  const shellClassName = isOrg
    ? "org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8"
    : "space-y-8 p-6";
  const propertyHref = (propertyId: string) =>
    isOrg
      ? `/dashboard/org/properties/${propertyId}`
      : `/properties/${propertyId}`;

  return (
    <div className={shellClassName}>
      {isOrg ? <nav aria-label="Move-out workspace" className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">
        <Link href="/dashboard/org/move-outs" aria-current="page" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><FileText aria-hidden="true" className="size-4" />Move-out notices</Link>
        <Link href="/dashboard/org/inspections" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-muted/50 px-4 text-sm font-semibold text-foreground"><CalendarDays aria-hidden="true" className="size-4" />Inspection schedule</Link>
      </nav> : null}
      <section className={isOrg ? panelShellClassName : undefined}>
        <div className={isOrg ? "border-b border-border px-5 py-5 sm:px-6" : undefined}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              {isOrg ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
                  Tenant lifecycle
                </div>
              ) : null}
              <h1
                className={`font-semibold tracking-tight text-foreground ${
                  isOrg ? "mt-4 text-2xl sm:text-3xl" : "text-3xl"
                }`}
              >
                Move-out notices
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Review tenant notices at a glance. Open a notice to manage inspection, clearance, and handover.
              </p>
              <InAppGuideHint
                topic="moveOut"
                workspace="org"
                orgRole={session.activeOrgRole}
              />
            </div>

            <Link data-workspace-action="true"
              href="/dashboard/org/inspections"
              className={
                isOrg
                  ? "inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
                  : "inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              }
            >
              <span className="inline-flex items-center gap-2"><ClipboardList aria-hidden="true" className="h-4 w-4" />Open inspections<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></span>
            </Link>
          </div>
        </div>

        <div
          className={
            isOrg
              ? "grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-3 sm:px-6 xl:grid-cols-5"
              : "grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5"
          }
        >
          {[
            { label: "Total notices", count: totalNotices, Icon: Users, tone: "text-sky-700 dark:text-sky-300 bg-sky-500/10" },
            { label: "Submitted", count: submittedCount, Icon: FileText, tone: "text-amber-700 dark:text-amber-300 bg-amber-500/10" },
            { label: "Inspection scheduled", count: scheduledCount, Icon: CalendarDays, tone: "text-teal-700 dark:text-teal-300 bg-teal-500/10" },
            { label: "Inspection complete", count: completedCount, Icon: ClipboardList, tone: "text-blue-700 dark:text-blue-300 bg-blue-500/10" },
            { label: "Closed", count: closedCount, Icon: CheckCircle2, tone: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10" },
          ].map(({ label, count, Icon, tone }) => (
            <div key={label} className="min-w-0 rounded-2xl border border-border bg-background/70 p-3 sm:p-4">
              <div className="flex items-center gap-2.5">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon aria-hidden="true" className="size-4" /></span>
                <div className="min-w-0"><p className="truncate text-[11px] font-medium leading-4 text-muted-foreground sm:text-xs">{label}</p><p className="mt-0.5 text-xl font-semibold leading-6 tracking-tight">{count}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className={
          isOrg
            ? panelShellClassName
            : "overflow-hidden rounded-xl border bg-background shadow-sm"
        }
      >
        <div className={isOrg ? "border-b border-border px-5 py-4 sm:px-6" : "border-b px-4 py-3"}>
          <div className="flex items-center justify-between gap-3">
            <div><h2 className={isOrg ? "text-lg font-semibold text-foreground" : "text-base font-semibold"}>Move-out notices</h2><p className="mt-1 text-xs text-muted-foreground">Review the latest updates and next steps for each tenant.</p></div>
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{totalNotices}</span>
          </div>
        </div>

        {notices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <p>No move-out notices found.</p>
            <div className="mt-4 flex justify-center">
              <InAppGuideLink
                topic="moveOut"
                workspace="org"
                orgRole={session.activeOrgRole}
                variant="card"
              />
            </div>
          </div>
        ) : (
          <div className="grid items-stretch gap-4 bg-muted/15 p-4 sm:p-5 xl:grid-cols-2">
            {notices.map((notice) => {
              const noticeHref = `/dashboard/org/move-outs/${encodePublicId(notice.id, "move-out-notice")}`;
              const nextStep = notice.status === "SUBMITTED" ? "Schedule the move-out inspection."
                : notice.status === "INSPECTION_SCHEDULED" ? "Complete the scheduled inspection."
                : notice.status === "INSPECTION_COMPLETED" ? "Review settlement and proceed to handover."
                : notice.status === "CANCELLED" ? "Notice withdrawn. The lease continues."
                : "Review the final statement and deposit settlement.";
              return (
                <article key={notice.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex-1 space-y-5 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Users aria-hidden="true" className="size-5" /></span>
                        <div className="min-w-0"><h3 className="break-words text-base font-semibold"><Link href={noticeHref} className="hover:text-primary hover:underline">{notice.tenant.fullName}</Link></h3><p className="mt-1 text-sm text-muted-foreground">Unit {notice.lease.unit.houseNo}</p></div>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${notice.status === "CLOSED" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" : notice.status === "CANCELLED" ? "border-border bg-muted text-muted-foreground" : "border-primary/20 bg-primary/10 text-primary"}`}>{statusLabel[notice.status] ?? notice.status}</span>
                    </div>
                    <DeferredLink href={propertyHref(notice.lease.unit.property.id)} className="flex items-start gap-2 text-sm text-muted-foreground hover:text-primary"><Home aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span className="break-words">{[notice.lease.unit.property.name, notice.lease.unit.building?.name].filter(Boolean).join(" · ")}</span></DeferredLink>
                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/30 p-3">
                      <Detail icon={<CalendarDays aria-hidden="true" className="size-3.5" />} label="Notice received" value={formatDate(notice.noticeDate)} />
                      <Detail icon={<LogOut aria-hidden="true" className="size-3.5" />} label="Moving out" value={formatDate(notice.moveOutDate)} />
                    </div>
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Inspection</dt><dd className="mt-1 break-words font-medium">{notice.inspection ? formatDateTime(notice.inspection.scheduledAt) : "Not scheduled"}</dd>{notice.inspection?.inspector.fullName ? <dd className="mt-1 break-words text-xs text-muted-foreground">{notice.inspection.inspector.fullName}</dd> : null}</div>
                      <div><dt className="text-xs text-muted-foreground">Current amount owed</dt><dd className={`mt-1 font-semibold ${notice.currentAmountOwed > 0 ? "text-amber-800 dark:text-amber-200" : "text-foreground"}`}>{new Intl.NumberFormat("en-KE", { style: "currency", currency: props.currencyCode }).format(notice.currentAmountOwed)}</dd><dd className="mt-1 text-xs text-muted-foreground">{notice.financialStatus === "PRELIMINARY" ? "Subject to final settlement" : notice.financialStatus.replaceAll("_", " ").toLowerCase()}</dd></div>
                    </dl>
                    <div className="rounded-xl border border-border bg-background/60 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next step</p><p className="mt-1 text-sm leading-6">{nextStep}</p>{notice.currentAmountOwed > 0 && !["CLOSED", "CANCELLED"].includes(notice.status) ? <p className="mt-1 text-xs leading-5 text-muted-foreground">Arrears require an admin or authorised approver before handover.</p> : null}</div>
                  </div>
                  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/15 px-5 py-4 sm:px-6">
                    <a href={`/api/move-outs/${encodePublicId(notice.id, "move-out-notice")}/report`} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><FileText aria-hidden="true" className="size-4" />{notice.status === "CLOSED" ? "Final statement" : "Move-out report"}</a>
                    <Link href={noticeHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Open notice<ArrowUpRight aria-hidden="true" className="size-4" /></Link>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <MoveOutsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        showingFrom={showingFrom}
        showingTo={showingTo}
        totalNotices={totalNotices}
        basePath="/dashboard/org/move-outs"
      />
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-background/70 p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
        {icon}
        {label}
      </p>
      <p className="mt-1 whitespace-normal break-words text-sm font-semibold leading-5 text-foreground">
        {value}
      </p>
    </div>
  );
}
