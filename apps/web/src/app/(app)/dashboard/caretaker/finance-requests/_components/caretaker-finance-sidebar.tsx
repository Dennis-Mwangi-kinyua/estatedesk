import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import {
  FocusTaskCard,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { FINANCE_GUIDANCE } from "../_lib/constants";

export function CaretakerFinanceSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Finance guidance"
      description="How caretaker spend requests move through accounts review."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
        <div className="mt-4 space-y-3">
          {FINANCE_GUIDANCE.map((item) => (
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
