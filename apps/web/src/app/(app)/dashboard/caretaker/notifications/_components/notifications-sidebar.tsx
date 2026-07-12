import {
  ClipboardList,
  Droplets,
  Home,
  Wrench,
} from "lucide-react";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import {
  panelShellClassName,
  QuickLinkCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  NOTIFICATIONS_GUIDANCE,
  NOTIFICATIONS_QUICK_ACTIONS,
} from "../_lib/constants";

const QUICK_ACTION_ICONS = {
  Issues: Wrench,
  Inspections: ClipboardList,
  "Water bills": Droplets,
  Dashboard: Home,
} as const;

export function NotificationsSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Quick actions"
      description="Jump to related caretaker workspaces from your inbox."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Jump to related caretaker workspaces from your inbox.
        </p>

        <div className="mt-4 space-y-3">
          {NOTIFICATIONS_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? Home;

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
        <h2 className="text-sm font-semibold text-foreground">What you&apos;ll see here</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Common notification types for caretakers in the field.
        </p>

        <div className="mt-4 space-y-3">
          {NOTIFICATIONS_GUIDANCE.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </WorkspaceGuidePanel>
  );
}