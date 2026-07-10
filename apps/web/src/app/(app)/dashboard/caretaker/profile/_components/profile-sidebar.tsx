import {
  Bell,
  Home,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  FocusTaskCard,
  panelShellClassName,
  QuickLinkCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { PROFILE_GUIDANCE, PROFILE_QUICK_ACTIONS } from "../_lib/constants";

const QUICK_ACTION_ICONS = {
  Notifications: Bell,
  Security: ShieldCheck,
  "Change password": KeyRound,
  Dashboard: Home,
} as const;

export function ProfileSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Quick actions"
      description="Manage account access and jump to related caretaker tools."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Manage account access and jump to related caretaker tools.
        </p>

        <div className="mt-4 space-y-3">
          {PROFILE_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? Bell;

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

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Profile guidance</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          How your employment record is maintained in EstateDesk.
        </p>

        <div className="mt-4 space-y-3">
          {PROFILE_GUIDANCE.map((item) => (
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