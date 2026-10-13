import { WorkflowStepCards } from "@/components/help/workflow-step-list";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { panelShellClassName } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { INSPECTIONS_WORKFLOW } from "../_lib/constants";

export function InspectionsSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Inspection workflow"
      description="Suggested process for move-out inspections in the field."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <div className="mt-4 space-y-3">
          <WorkflowStepCards steps={INSPECTIONS_WORKFLOW} />
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
    </WorkspaceGuidePanel>
  );
}
