import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import {
  FocusTaskCard,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { NEW_ISSUE_GUIDANCE } from "../_lib/constants";

export function NewIssueSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Reporting guidance"
      description="Tips for creating actionable maintenance tickets."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
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
