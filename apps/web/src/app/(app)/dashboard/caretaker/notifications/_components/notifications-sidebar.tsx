import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import { panelShellClassName } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  NOTIFICATIONS_GUIDANCE,
} from "../_lib/constants";

export function NotificationsSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Notification guide"
      description="Common notification types for caretakers in the field."
      triggerClassName={panelShellClassName}
    >
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
