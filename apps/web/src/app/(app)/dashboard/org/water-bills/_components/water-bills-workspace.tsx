import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { Droplets } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { WaterApprovalQueuePanel } from "@/app/(app)/dashboard/org/notifications/_components/water-approval-queue-panel";
import type { getOrgWaterBillsPageData } from "../_lib/queries";

const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

type WaterBillsPageData = Awaited<ReturnType<typeof getOrgWaterBillsPageData>>;

export function WaterBillsWorkspace({
  data,
  orgRole,
}: {
  data: WaterBillsPageData;
  orgRole?: OrgRole | null;
}) {
  const { membership, approvalQueue, approvalQueueCount, rejectedReadingsCount } =
    data;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={panelShellClassName}>
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Droplets className="h-3.5 w-3.5" />
                Utility billing
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Water bills desk
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Review caretaker meter readings, approve tenant bills, and keep
                water collections aligned with the portfolio ledger.
              </p>
              <InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} />
            </div>
            <Link
              href="/dashboard/org/notifications"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              Open operations hub
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Pending approval
              </p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  approvalQueueCount > 0
                    ? "text-amber-700 dark:text-amber-200"
                    : "text-foreground"
                }`}
              >
                {approvalQueueCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Rejected readings
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {rejectedReadingsCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <WaterApprovalQueuePanel
        membership={membership}
        approvalQueue={approvalQueue}
        approvalQueueCount={approvalQueueCount}
      />
    </div>
  );
}