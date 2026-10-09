import { releaseMoveOutUnitAction } from "../_lib/actions";
import { ScheduleForm } from "@/features/move-outs/components/schedule-form";
import { SettlementSummary } from "@/features/move-outs/components/settlement-summary";
import { RefundForm } from "@/features/move-outs/components/refund-form";
import { canInspectUnit } from "@/lib/move-outs/inspection-scope";
import { nairobiDate } from "@/lib/move-outs/validation";
import { CloseoutForm } from "@/features/move-outs/components/closeout-form";
import { MoveOutProgress } from "@/features/move-outs/components/progress";
import Link from "next/link";
import { LogOut } from "lucide-react";
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
      <section className={isOrg ? panelShellClassName : undefined}>
        <div className={isOrg ? "border-b border-border px-5 py-5 sm:px-6" : undefined}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              {isOrg ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <LogOut className="h-3.5 w-3.5" />
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
                Review notices, schedule inspections, and confirm the final handover and deposit settlement.
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
              Open inspections
            </Link>
          </div>
        </div>

        <div
          className={
            isOrg
              ? "grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-5 sm:px-6"
              : "grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
          }
        >
        <div
          className={
            isOrg
              ? "rounded-2xl border border-border bg-muted/10 p-4"
              : "rounded-xl border bg-background p-4 shadow-sm"
          }
        >
          <p className="text-sm text-muted-foreground">Total Notices</p>
          <p className="mt-2 text-2xl font-semibold">{totalNotices}</p>
        </div>

        <div
          className={
            isOrg
              ? "rounded-2xl border border-border bg-muted/10 p-4"
              : "rounded-xl border bg-background p-4 shadow-sm"
          }
        >
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="mt-2 text-2xl font-semibold">{submittedCount}</p>
        </div>

        <div
          className={
            isOrg
              ? "rounded-2xl border border-border bg-muted/10 p-4"
              : "rounded-xl border bg-background p-4 shadow-sm"
          }
        >
          <p className="text-sm text-muted-foreground">Inspection Scheduled</p>
          <p className="mt-2 text-2xl font-semibold">{scheduledCount}</p>
        </div>

        <div
          className={
            isOrg
              ? "rounded-2xl border border-border bg-muted/10 p-4"
              : "rounded-xl border bg-background p-4 shadow-sm"
          }
        >
          <p className="text-sm text-muted-foreground">Inspection Completed</p>
          <p className="mt-2 text-2xl font-semibold">{completedCount}</p>
        </div>

        <div
          className={
            isOrg
              ? "rounded-2xl border border-border bg-muted/10 p-4"
              : "rounded-xl border bg-background p-4 shadow-sm"
          }
        >
          <p className="text-sm text-muted-foreground">Closed</p>
          <p className="mt-2 text-2xl font-semibold">{closedCount}</p>
        </div>
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
          <h2 className={isOrg ? "text-lg font-semibold text-foreground" : "text-base font-semibold"}>
            All move-out notices
          </h2>
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
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Notice Date</th>
                  <th className="px-4 py-3 font-medium">Move-out Date</th>
                  <th className="px-4 py-3 font-medium">Notice Status</th>
                  <th className="px-4 py-3 font-medium">Inspection</th>
                  <th className="px-4 py-3 font-medium">Inspector</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {notice.tenant.fullName}
                    </td>

                    <td className="px-4 py-3">
                      <DeferredLink
                        href={propertyHref(notice.lease.unit.property.id)}
                        className="font-medium text-foreground underline-offset-4 transition hover:text-primary hover:underline"
                      >
                        {notice.lease.unit.property.name}
                      </DeferredLink>
                    </td>

                    <td className="px-4 py-3">
                      {notice.lease.unit.building?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3">{notice.lease.unit.houseNo}</td>

                    <td className="px-4 py-3">
                      {formatDate(notice.noticeDate)}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(notice.moveOutDate)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                        {notice.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {notice.inspection
                        ? `${notice.inspection.status} • ${formatDateTime(
                            notice.inspection.scheduledAt
                          )}`
                        : "Not scheduled"}
                    </td>

                    <td className="px-4 py-3">
                      {notice.inspection?.inspector.fullName ?? "—"}
                    </td>

                    <td className="min-w-[340px] px-4 py-3">
                      <div className="mb-3"><MoveOutProgress status={notice.status} closeout={notice.closeout} />
                        <SettlementSummary closeout={notice.closeout} />
                        <p className="my-2 text-xs">Financial status: {notice.financialStatus.replaceAll("_", " ")} · Current amount owed: {notice.currentAmountOwed.toFixed(2)}</p>
                        <a className="text-xs underline" href={`/api/move-outs/${notice.id}/report`}>{notice.status === "CLOSED" ? "Download final statement" : "Generate pre-handover report"}</a>
                        {notice.status === "CLOSED" && notice.lease.unit.status === "UNDER_MAINTENANCE" ? <form action={releaseMoveOutUnitAction} className="mt-2 text-xs"><input name="noticeId" type="hidden" value={notice.id} /><label className="flex gap-2"><input type="checkbox" className="mt-0.5 size-4 shrink-0" name="readyConfirmed" required />Repairs and cleaning completed; unit ready to let.</label><button className="mt-2 rounded border px-3 py-2">Mark unit vacant and ready</button></form> : null}
                        {notice.status === "CLOSED" && notice.closeout && typeof notice.closeout === "object" && !Array.isArray(notice.closeout) && notice.closeout.refundStatus === "PENDING" ? <RefundForm noticeId={notice.id} /> : null}</div>
                      {["SUBMITTED", "INSPECTION_SCHEDULED"].includes(notice.status) ? (
                        inspectors.some(inspector => canInspectUnit([inspector], notice.lease.unit)) ? (
                          <ScheduleForm noticeId={notice.id} reschedule={Boolean(notice.inspection)} inspectors={Array.from(new Map(inspectors.filter(inspector => canInspectUnit([inspector], notice.lease.unit)).map(inspector => [inspector.userId, { id: inspector.userId, label: `${inspector.user.fullName} (${inspector.role})` }])).values())} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Add active staff in this unit’s scope before scheduling.
                          </span>
                        )
                      ) : notice.inspection ? (
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/dashboard/org/inspections/${encodePublicId(
                              notice.inspection.id,
                              "inspection",
                            )}`}
                            className="text-xs font-semibold text-primary hover:text-primary/80"
                          >
                            Open report
                          </Link>
                          {notice.status === "INSPECTION_COMPLETED" ? (
                            <CloseoutForm dateLimit={nairobiDate()} noticeId={notice.id} deposit={notice.lease.deposit?.toString() ?? "0"} action={closeMoveOutAction} />
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No action
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
