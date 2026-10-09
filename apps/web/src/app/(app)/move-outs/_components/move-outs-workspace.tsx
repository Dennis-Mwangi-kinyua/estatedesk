import { ReleaseUnitForm } from "@/features/move-outs/components/release-unit-form";
import { ScheduleForm } from "@/features/move-outs/components/schedule-form";
import { SettlementSummary } from "@/features/move-outs/components/settlement-summary";
import { RefundForm } from "@/features/move-outs/components/refund-form";
import { canInspectUnit } from "@/lib/move-outs/inspection-scope";
import { nairobiDate } from "@/lib/move-outs/validation";
import { CloseoutForm } from "@/features/move-outs/components/closeout-form";
import { MoveOutProgress } from "@/features/move-outs/components/progress";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  MapPin,
  Users,
} from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { encodePublicId } from "@/lib/public-id";
import { closeMoveOutAction } from "../_lib/actions";
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
    inspectors,
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
                Move-outs
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Review notices, plan inspections, and track each handover through settlement.
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
            { label: "Total notices", count: totalNotices, Icon: Users, tone: "text-sky-700 bg-sky-500/10" },
            { label: "Submitted", count: submittedCount, Icon: FileText, tone: "text-amber-700 bg-amber-500/10" },
            { label: "Inspection scheduled", count: scheduledCount, Icon: CalendarDays, tone: "text-violet-700 bg-violet-500/10" },
            { label: "Inspection complete", count: completedCount, Icon: ClipboardList, tone: "text-blue-700 bg-blue-500/10" },
            { label: "Closed", count: closedCount, Icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-500/10" },
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
          <div className="grid gap-3 bg-muted/15 p-3 sm:p-4 lg:gap-4 lg:p-5">
            {notices.map((notice) => (
              <article key={notice.id} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                  <div className="min-w-0 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Users aria-hidden="true" className="size-5" /></span>
                        <div className="min-w-0"><h3 className="truncate text-base font-semibold leading-6">{notice.tenant.fullName}</h3><DeferredLink href={propertyHref(notice.lease.unit.property.id)} className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"><Home aria-hidden="true" className="size-3.5 shrink-0" /><span className="truncate">{notice.lease.unit.property.name}</span></DeferredLink></div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${notice.status === "CLOSED" ? "bg-emerald-500/10 text-emerald-700" : notice.status === "CANCELLED" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}><span className="size-1.5 rounded-full bg-current" />{statusLabel[notice.status] ?? notice.status}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/30 p-3 sm:grid-cols-4">
                      <Detail icon={<MapPin aria-hidden="true" className="size-3.5" />} label="Location" value={[notice.lease.unit.building?.name, `Unit ${notice.lease.unit.houseNo}`].filter(Boolean).join(" · ")} />
                      <Detail icon={<CalendarDays aria-hidden="true" className="size-3.5" />} label="Notice date" value={formatDate(notice.noticeDate)} />
                      <Detail icon={<LogOut aria-hidden="true" className="size-3.5" />} label="Move-out date" value={formatDate(notice.moveOutDate)} />
                      <Detail icon={<ClipboardList aria-hidden="true" className="size-3.5" />} label="Inspection" value={notice.inspection ? formatDateTime(notice.inspection.scheduledAt) : "Not scheduled"} />
                    </div>
                    {notice.inspection?.inspector.fullName ? <p className="mt-3 text-xs text-muted-foreground">Inspector: <span className="font-medium text-foreground">{notice.inspection.inspector.fullName}</span></p> : null}
                    <div className="mt-4 border-t border-border pt-4"><MoveOutProgress status={notice.status} closeout={notice.closeout} /></div>
                  </div>
                  <div className="min-w-0 border-t border-border bg-muted/10 p-4 sm:p-5 lg:border-l lg:border-t-0">
                    <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold">Next steps & settlement</h4><a className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline" href={`/api/move-outs/${notice.id}/report`}><FileText aria-hidden="true" className="size-3.5" />{notice.status === "CLOSED" ? "Final statement" : "Move-out report"}</a></div>
                    <p className="mt-2 text-xs text-muted-foreground">{notice.financialStatus.replaceAll("_", " ")} <span aria-hidden="true">·</span> Current amount owed <span className="font-semibold text-foreground">{notice.currentAmountOwed.toFixed(2)}</span></p>
                    <div className="mt-3"><SettlementSummary closeout={notice.closeout} /></div>
                    {notice.status === "CLOSED" && notice.lease.unit.status === "UNDER_MAINTENANCE" ? <ReleaseUnitForm noticeId={notice.id} /> : null}
                    {notice.status === "CLOSED" && notice.closeout && typeof notice.closeout === "object" && !Array.isArray(notice.closeout) && notice.closeout.refundStatus === "PENDING" ? <RefundForm noticeId={notice.id} /> : null}
                    {["SUBMITTED", "INSPECTION_SCHEDULED"].includes(notice.status) ? (
                      inspectors.some(inspector => canInspectUnit([inspector], notice.lease.unit)) ? <ScheduleForm noticeId={notice.id} reschedule={Boolean(notice.inspection)} inspectors={Array.from(new Map(inspectors.filter(inspector => canInspectUnit([inspector], notice.lease.unit)).map(inspector => [inspector.userId, { id: inspector.userId, label: `${inspector.user.fullName} (${inspector.role})` }])).values())} /> : <p className="mt-3 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">Add active staff in this unit’s scope before scheduling.</p>
                    ) : notice.inspection ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3"><Link href={`/dashboard/org/inspections/${encodePublicId(notice.inspection.id, "inspection")}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-primary hover:bg-muted"><ClipboardList aria-hidden="true" className="size-4" />Open inspection report</Link>{notice.status === "INSPECTION_COMPLETED" ? <CloseoutForm dateLimit={nairobiDate()} noticeId={notice.id} deposit={notice.lease.deposit?.toString() ?? "0"} action={closeMoveOutAction} /> : null}</div>
                    ) : <p className="mt-3 text-xs text-muted-foreground">No action is needed right now.</p>}
                  </div>
                </div>
              </article>
            ))}
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
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-semibold text-foreground sm:text-sm" title={value}>
        {value}
      </p>
    </div>
  );
}
