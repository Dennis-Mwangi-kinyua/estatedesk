import { ClipboardList, FileText, HelpCircle, Home, Wrench } from "lucide-react";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  panelShellClassName,
  QuickLinkCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { INSPECTIONS_QUICK_ACTIONS, INSPECTIONS_WORKFLOW } from "../_lib/constants";

const QUICK_ACTION_ICONS = {
  Dashboard: Home,
  Issues: Wrench,
  Leases: FileText,
  "Help guides": HelpCircle,
} as const;

export function InspectionsSidebar() {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Jump to related caretaker workflows after reviewing inspections.
        </p>

        <div className="mt-4 space-y-3">
          {INSPECTIONS_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? ClipboardList;

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
        <h2 className="text-sm font-semibold text-foreground">Inspection workflow</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Suggested process for move-out inspections in the field.
        </p>

        <div className="mt-4 space-y-3">
          {INSPECTIONS_WORKFLOW.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </span>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <InAppGuideLink
            topic="moveOut"
            workspace="caretaker"
            variant="card"
            className="w-full justify-center"
          />
        </div>
      </section>
    </aside>
  );
}