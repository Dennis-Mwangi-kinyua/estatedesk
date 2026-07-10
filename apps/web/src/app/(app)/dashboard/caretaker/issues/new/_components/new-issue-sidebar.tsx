import { Bell, ClipboardList, Home, Wrench } from "lucide-react";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import {
  FocusTaskCard,
  panelShellClassName,
  QuickLinkCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { NEW_ISSUE_GUIDANCE, NEW_ISSUE_QUICK_ACTIONS } from "../_lib/constants";

const QUICK_ACTION_ICONS = {
  "My issues": Wrench,
  Inspections: ClipboardList,
  Notifications: Bell,
  Dashboard: Home,
} as const;

export function NewIssueSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Quick actions"
      description="Jump to related caretaker workflows after reporting an issue."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Jump to related caretaker workflows after reporting an issue.
        </p>

        <div className="mt-4 space-y-3">
          {NEW_ISSUE_QUICK_ACTIONS.map((action) => {
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
        <h2 className="text-sm font-semibold text-foreground">Reporting guidance</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Tips for creating actionable maintenance tickets.
        </p>

        <div className="mt-4 space-y-3">
          {NEW_ISSUE_GUIDANCE.map((item) => (
            <FocusTaskCard
              key={item.title}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}