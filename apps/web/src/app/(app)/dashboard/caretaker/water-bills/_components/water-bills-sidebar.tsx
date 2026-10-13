import { WorkflowStepCards } from "@/components/help/workflow-step-list";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { WATER_BILLS_WORKFLOW } from "../_lib/constants";

export function WaterBillsSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Billing workflow"
      description="Suggested process from meter capture to tenant billing."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <div className="mt-4 space-y-3">
          <WorkflowStepCards steps={WATER_BILLS_WORKFLOW} />
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
    </WorkspaceGuidePanel>
  );
}
