import { STAFF_SETUP_GUIDANCE } from "../_lib/constants";
import { WorkspaceGuidePanel } from "@/components/help/workspace-guide-panel";

export function StaffNewGuidance() {
  return (
    <WorkspaceGuidePanel
      title="Staff onboarding"
      description="Pick the operational role before entering profile details. Caretakers map to a property or apartment/block in the first step."
    >
      {STAFF_SETUP_GUIDANCE.map((item) => (
        <div
          key={item.title}
          className="rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
        </div>
      ))}
    </WorkspaceGuidePanel>
  );
}