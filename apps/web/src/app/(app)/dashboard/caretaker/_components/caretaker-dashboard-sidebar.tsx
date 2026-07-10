import Link from "next/link";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import {
  Building2,
  Calendar,
  ClipboardList,
  DoorOpen,
  Droplets,
  FileText,
  FolderOpen,
  ListTodo,
  Megaphone,
  NotebookPen,
  Search,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { encodePublicId } from "@/lib/public-id";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  CARETAKER_DASHBOARD_GUIDANCE,
  CARETAKER_QUICK_ACTIONS,
} from "@/app/(app)/dashboard/caretaker/_lib/constants";
import {
  formatDateTime,
  getUnitLabel,
} from "@/app/(app)/dashboard/caretaker/_lib/helpers";
import type {
  CaretakerDashboardStats,
  UpcomingInspection,
} from "@/app/(app)/dashboard/caretaker/_lib/types";
import {
  MiniMetric,
  panelShellClassName,
  QuickLinkCard,
} from "./caretaker-ui";

const QUICK_ACTION_ICONS = {
  "Today's work": ListTodo,
  Search,
  Calendar,
  Units: Building2,
  Issues: Wrench,
  "Move-outs": DoorOpen,
  Documents: FolderOpen,
  Broadcasts: Megaphone,
  Handover: NotebookPen,
  Vendors: Truck,
  Inspections: ClipboardList,
  "Water bills": Droplets,
  Leases: FileText,
  Tenants: Users,
} as const;

export function CaretakerDashboardSidebar({
  data,
  upcomingInspections,
}: {
  data: CaretakerDashboardStats;
  upcomingInspections: UpcomingInspection[];
}) {
  return (
    <WorkspaceGuidePanel
      title="Quick actions"
      description="Open a section to review field work in your assigned scope."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Open a section to review field work in your assigned scope.
        </p>

        <div className="mt-4 space-y-3">
          {CARETAKER_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? Wrench;

            return (
              <QuickLinkCard
                key={action.href}
                href={action.href}
                title={action.title}
                description={action.description}
                icon={Icon}
              />
            );
          })}
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Weekly snapshot</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Performance overview across leases, tenants, and inspections.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniMetric
            label="Active leases"
            value={data.activeLeases.toLocaleString()}
          />
          <MiniMetric
            label="Active tenants"
            value={data.activeTenants.toLocaleString()}
          />
          <MiniMetric
            label="Scheduled inspections"
            value={data.scheduledInspections.toLocaleString()}
          />
          <MiniMetric
            label="Urgent issues"
            value={data.urgentIssues.toLocaleString()}
          />
        </div>

        {upcomingInspections.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Upcoming inspections
            </p>
            {upcomingInspections.map((inspection) => (
              <Link
                key={inspection.id}
                href={`/dashboard/caretaker/inspections/${encodePublicId(
                  inspection.id,
                  "inspection",
                )}`}
                className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-muted/10 p-3 text-sm transition hover:border-primary/25 hover:bg-muted/20"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {inspection.notice.tenant.fullName}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {getUnitLabel({ unit: inspection.notice.lease.unit })}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {formatDateTime(inspection.scheduledAt)}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Field guidance</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Common caretaker workflows for inspections, billing, and maintenance.
        </p>

        <div className="mt-4 space-y-3">
          {CARETAKER_DASHBOARD_GUIDANCE.map((item) => (
            <div
              key={item.href}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-3 inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
              >
                {item.actionLabel}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <InAppGuideLink
            topic="caretaker"
            workspace="caretaker"
            variant="card"
            className="w-full justify-center"
          />
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}