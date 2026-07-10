import { Bell, Home, KeyRound, UserRound } from "lucide-react";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import {
  FocusTaskCard,
  panelShellClassName,
  QuickLinkCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  SECURITY_GUIDANCE,
  SECURITY_QUICK_ACTIONS,
} from "../_lib/constants";

const QUICK_ACTION_ICONS = {
  "My profile": UserRound,
  "Change password": KeyRound,
  Notifications: Bell,
  Dashboard: Home,
} as const;

export function SecuritySidebar() {
  return (
    <WorkspaceGuidePanel
      title="Quick actions"
      description="Manage account access and return to related caretaker tools."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Manage account access and return to related caretaker tools.
        </p>

        <div className="mt-4 space-y-3">
          {SECURITY_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? UserRound;

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
        <h2 className="text-sm font-semibold text-foreground">Security guidance</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          How EstateDesk protects your caretaker account in the field.
        </p>

        <div className="mt-4 space-y-3">
          {SECURITY_GUIDANCE.map((item) => (
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