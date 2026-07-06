import {
  AlertCircle,
  ClipboardList,
  Hammer,
  Home,
  Plus,
} from "lucide-react";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { QuickLinkCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { ISSUES_QUICK_ACTIONS, ISSUES_WORKFLOW } from "../_lib/constants";
import {
  panelShellClassName,
  WorkflowStep,
} from "./issues-ui";

const QUICK_ACTION_ICONS = {
  "Create issue": Plus,
  "Open issues": AlertCircle,
  "In progress": Hammer,
  Dashboard: Home,
  Inspections: ClipboardList,
} as const;

export function IssuesSidebar() {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Useful shortcuts for logging and tracking field issues.
        </p>

        <div className="mt-4 space-y-3">
          {ISSUES_QUICK_ACTIONS.map((action) => {
            const Icon =
              QUICK_ACTION_ICONS[
                action.title as keyof typeof QUICK_ACTION_ICONS
              ] ?? Plus;

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
        <h2 className="text-sm font-semibold text-foreground">Workflow notes</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Suggested process for maintenance and tenant concerns.
        </p>

        <div className="mt-4 space-y-3">
          {ISSUES_WORKFLOW.map((item) => (
            <WorkflowStep
              key={item.step}
              step={item.step}
              title={item.title}
              description={item.description}
            />
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
    </aside>
  );
}