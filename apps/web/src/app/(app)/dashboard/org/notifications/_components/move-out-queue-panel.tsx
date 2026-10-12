import { ArrowUpRight, CalendarDays, ClipboardCheck, Mail, Phone } from "lucide-react";
import { EmojiSticker } from "@/components/shared/emoji-sticker";
import { nairobiDate } from "@/lib/move-outs/validation";
import { CloseoutForm } from "@/features/move-outs/components/closeout-form";
import Link from "@/components/navigation/workspace-link";
import { confirmMoveOutAction } from "@/app/(app)/dashboard/org/notifications/actions";
import {
  formatDateTime,
  formatEnumLabel,
  formatMoney,
  toNumber,
} from "@/app/(app)/dashboard/org/notifications/_lib/helpers";
import type {
  MoveOutQueueItem,
  OrgContext,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";
import {
  EmptyState,
  PanelHeader,
  panelBodyClassName,
  panelChipClassName,
  panelShellClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/app/(app)/dashboard/org/notifications/_components/notifications-ui";
import { encodePublicId } from "@/lib/public-id";

type MoveOutQueuePanelProps = {
  membership: OrgContext;
  moveOutQueue: MoveOutQueueItem[];
};

export function MoveOutQueuePanel({
  membership,
  moveOutQueue,
}: MoveOutQueuePanelProps) {
  const readyCount = moveOutQueue.filter(notice => notice.status === "INSPECTION_COMPLETED").length;
  return (
    <section aria-label="Notice review queue" className={panelShellClassName}>
      <div className={`${panelBodyClassName} flex flex-col gap-4 border-b border-border sm:flex-row sm:items-start sm:justify-between`}>
        <PanelHeader eyebrow="Move-out desk" title="Notice review queue"
          description="Review each notice, check outstanding balances, and complete handover after inspection." />
        <div className="flex shrink-0 flex-wrap gap-2 text-xs font-semibold">
          <span className={panelChipClassName}>{moveOutQueue.length} notices</span>
          <span className={panelChipClassName}>{readyCount} inspections complete</span>
        </div>
      </div>
      <div className={panelBodyClassName}>
        {moveOutQueue.length === 0 ? (
          <EmptyState title="No move-outs waiting" message="New tenant notices will appear here immediately after submission." />
        ) : (
          <div className="notice-review-grid">
            {moveOutQueue.map(notice => {
              const rentBalance = notice.lease.rentCharges.reduce((sum, charge) => sum + toNumber(charge.balance), 0);
              const waterBalance = notice.tenant.waterBills.reduce((sum, bill) => sum + toNumber(bill.total), 0);
              const clearanceBalance = rentBalance + waterBalance;
              const ready = notice.status === "INSPECTION_COMPLETED";
              return (
                <article key={notice.id} className="notice-review-card flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
                  <header className="space-y-4 border-b border-border p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <EmojiSticker label="tenant" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold leading-6 text-foreground">{notice.tenant.fullName}</h3>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">{notice.lease.unit.property.name}</p>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">Unit {notice.lease.unit.houseNo}{notice.lease.unit.building?.name ? ` · ${notice.lease.unit.building.name}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`notice-status ${ready ? "notice-status--ready" : "notice-status--pending"}`}><ClipboardCheck aria-hidden="true" className="h-4 w-4 shrink-0" />{formatEnumLabel(notice.status)}</span>
                      <span className={`notice-status ${clearanceBalance <= 0 ? "notice-status--ready" : "notice-status--pending"}`}>{clearanceBalance <= 0 ? "Clearance ready" : "Balance pending"}</span>
                    </div>
                  </header>
                  <div className="flex-1 space-y-5 p-4 sm:p-5">
                    <dl className="grid gap-4 sm:grid-cols-2">
                      {[{ label: "Move-out date", value: notice.moveOutDate }, { label: "Notice submitted", value: notice.noticeDate }].map(item => <div key={item.label} className="min-w-0"><dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><CalendarDays aria-hidden="true" className="h-4 w-4 text-primary" />{item.label}</dt><dd className="mt-1 text-sm font-semibold leading-6 text-foreground">{formatDateTime(item.value, membership.org.timezone)}</dd></div>)}
                    </dl>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-start gap-2"><Phone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{notice.tenant.phone || "No phone provided"}</span></p>
                      {notice.tenant.email ? <p className="flex items-start gap-2"><Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="min-w-0">{notice.tenant.email}</span></p> : null}
                    </div>
                    <dl className="notice-balance-grid">
                      {[{ label: "Rent balance", value: rentBalance, icon: "rent" }, { label: "Water balance", value: waterBalance, icon: "water" }, { label: "Total clearance", value: clearanceBalance, icon: "balance" }].map(item => <div key={item.label} className="min-w-0 rounded-xl border border-border bg-muted/30 p-3"><dt className="flex items-center gap-2 text-xs font-medium leading-5 text-muted-foreground"><EmojiSticker label={item.icon} size="xs" />{item.label}</dt><dd className="mt-3 break-words text-base font-semibold tabular-nums text-foreground">{formatMoney(item.value, membership.org.currencyCode)}</dd></div>)}
                    </dl>
                    {notice.notes ? <div className="rounded-xl border border-border bg-muted/20 p-3"><h4 className="text-xs font-semibold text-foreground">Tenant notes</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{notice.notes}</p></div> : null}
                    <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm leading-6 text-muted-foreground"><p className="font-semibold text-foreground">Next step</p>{ready ? "Inspection is complete. Review the final settlement before confirming handover." : notice.inspection ? `Review the ${formatEnumLabel(notice.inspection.status).toLowerCase()} inspection scheduled for ${formatDateTime(notice.inspection.scheduledAt, membership.org.timezone)}.` : "Schedule an inspection to review the unit before handover."}</div>
                  </div>
                  <footer className="space-y-4 border-t border-border p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link data-workspace-action="true" href={`/dashboard/org/tenants/${encodeURIComponent(notice.tenant.slug ?? notice.tenant.id)}`} className={primaryButtonClassName}>Review tenant<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></Link>
                      <Link data-workspace-action="true" href={notice.inspection ? `/dashboard/org/inspections/${encodePublicId(notice.inspection.id, "inspection")}` : "/dashboard/org/move-outs"} className={secondaryButtonClassName}>{notice.inspection ? "View inspection" : "Schedule inspection"}</Link>
                    </div>
                    {ready ? <details className="notice-closeout min-w-0 rounded-xl border border-border bg-muted/20"><summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-ring">Confirm handover and settlement</summary><div className="min-w-0 p-3 pt-0"><CloseoutForm dateLimit={nairobiDate()} noticeId={notice.id} action={confirmMoveOutAction} /></div></details> : <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ClipboardCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Handover confirmation becomes available after inspection is completed.</p>}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
