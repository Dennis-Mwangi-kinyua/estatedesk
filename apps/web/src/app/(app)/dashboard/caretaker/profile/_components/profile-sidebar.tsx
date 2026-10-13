import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";
import {
  FocusTaskCard,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { PROFILE_GUIDANCE } from "../_lib/constants";

export function ProfileSidebar() {
  return (
    <WorkspaceGuidePanel
      title="Profile guidance"
      description="How your employment record is maintained in EstateDesk."
      triggerClassName={panelShellClassName}
    >
      <section className={`${panelShellClassName} p-4`}>
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
