import { ClipboardList, FileText, Home, Users, Wrench } from "lucide-react";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  panelShellClassName,
  QuickLinkCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { LEASES_QUICK_ACTIONS } from "../_lib/constants";

const QUICK_ACTION_ICONS = {
  Tenants: Users,
  Issues: Wrench,
  Inspections: ClipboardList,
  Dashboard: Home,
} as const;

export function LeasesSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Quick actions"
      description="Jump to related caretaker records after reviewing leases."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Jump to related caretaker records after reviewing leases.
        </p>

        <div className="mt-4 space-y-3">
          {LEASES_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? FileText;

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