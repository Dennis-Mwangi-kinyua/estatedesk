import { Droplets, Home, Users, Wrench } from "lucide-react";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  FocusTaskCard,
  panelShellClassName,
  QuickLinkCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { READ_GUIDANCE, READ_QUICK_ACTIONS } from "../_lib/constants";

const QUICK_ACTION_ICONS = {
  "Water bills": Droplets,
  Issues: Wrench,
  Tenants: Users,
  Dashboard: Home,
} as const;

export function ReadSidebar() {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Jump between meter capture and related caretaker workflows.
        </p>

        <div className="mt-4 space-y-3">
          {READ_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? Droplets;

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
            topic="water"
            workspace="caretaker"
            variant="card"
            className="w-full justify-center"
          />
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Meter guidance</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          How readings move from the field to office approval.
        </p>

        <div className="mt-4 space-y-3">
          {READ_GUIDANCE.map((item) => (
            <FocusTaskCard
              key={item.title}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </section>
    </aside>
  );
}