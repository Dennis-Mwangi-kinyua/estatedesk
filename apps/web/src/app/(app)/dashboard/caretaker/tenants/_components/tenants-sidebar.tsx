import {
  ClipboardList,
  FileText,
  Home,
  Users,
  Wrench,
} from "lucide-react";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  panelShellClassName,
  QuickLinkCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { TENANTS_QUICK_ACTIONS } from "../_lib/constants";

const QUICK_ACTION_ICONS = {
  Leases: FileText,
  Issues: Wrench,
  Inspections: ClipboardList,
  Dashboard: Home,
} as const;

export function TenantsSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Quick actions"
      description="Jump to related records after reviewing tenants."
      triggerClassName={panelShellClassName}
    >
      {/* Mobile / tablet: 2×2 grid — no horizontal scroll */}
      <section className="lg:hidden">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Quick links
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TENANTS_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? Users;
            return (
              <a
                key={action.href}
                href={action.href}
                className="inline-flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/30"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{action.title}</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Large screens: full cards */}
      <section className={`hidden ${panelShellClassName} p-4 lg:block`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Jump to related records after reviewing tenants.
        </p>

        <div className="mt-4 space-y-3">
          {TENANTS_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? Users;

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
