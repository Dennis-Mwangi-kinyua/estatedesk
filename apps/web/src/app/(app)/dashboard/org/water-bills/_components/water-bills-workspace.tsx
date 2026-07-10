import type { ComponentType } from "react";
import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import {
  CheckCircle2,
  Droplets,
  Inbox,
  XCircle,
} from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import type { getOrgWaterBillsPageData } from "../_lib/queries";
import { WaterApprovalQueue } from "./water-approval-queue";

type WaterBillsPageData = Awaited<ReturnType<typeof getOrgWaterBillsPageData>>;

export function WaterBillsWorkspace({
  data,
  orgRole,
}: {
  data: WaterBillsPageData;
  orgRole?: OrgRole | null;
}) {
  const {
    membership,
    approvalQueue,
    approvalQueueCount,
    rejectedReadingsCount,
    approvedThisPeriodCount,
  } = data;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-5 px-4 pb-28 pt-4 sm:space-y-6 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Droplets className="h-3.5 w-3.5" />
                Utility billing
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Water readings &amp; approvals
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                Review caretaker meter submissions unit by unit, approve to
                issue tenant bills, or send readings back for correction.
              </p>
              <div className="mt-3">
                <InAppGuideHint
                  topic="portfolio"
                  workspace="org"
                  orgRole={orgRole}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                href="/dashboard/org/notifications"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
              >
                Operations hub
              </Link>
              {approvalQueueCount > 0 ? (
                <a
                  href="#approval-queue"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  Review {approvalQueueCount} pending
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Stats — one vertical stack of full-width rows (label left, value right) */}
      <section className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <StatTile
          label="Pending approval"
          value={approvalQueueCount}
          note="Submitted by caretakers"
          icon={Inbox}
          highlight={approvalQueueCount > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Rejected"
          value={rejectedReadingsCount}
          note="Sent back for re-read"
          icon={XCircle}
          highlight={rejectedReadingsCount > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Approved (all time)"
          value={approvedThisPeriodCount}
          note="Bills issued from readings"
          icon={CheckCircle2}
          highlight={approvedThisPeriodCount > 0 ? "success" : "default"}
        />
      </section>

      {/* Queue */}
      <div id="approval-queue">
        <WaterApprovalQueue
          membership={membership}
          approvalQueue={approvalQueue}
          approvalQueueCount={approvalQueueCount}
        />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  note,
  icon: Icon,
  highlight = "default",
}: {
  label: string;
  value: number;
  note: string;
  icon: ComponentType<{ className?: string }>;
  highlight?: "default" | "warning" | "success";
}) {
  const valueClass =
    highlight === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : highlight === "success"
        ? "text-emerald-700 dark:text-emerald-200"
        : "text-foreground";

  return (
    <div className="flex w-full flex-row items-center justify-between gap-4 border-t border-border px-4 py-4 first:border-t-0 sm:px-5 sm:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{note}</p>
        </div>
      </div>
      <p
        className={`shrink-0 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}
