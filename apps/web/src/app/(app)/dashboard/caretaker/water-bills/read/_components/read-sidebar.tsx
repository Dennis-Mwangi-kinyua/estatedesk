import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import {
  FocusTaskCard,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { READ_GUIDANCE } from "../_lib/constants";

export function ReadSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Meter guidance"
      description="How readings move from the field to office approval."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
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
    </WorkspaceGuidePanel>
  );
}
