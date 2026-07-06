import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import type { HelpWorkspace } from "@/lib/help/help-workspace";
import type { InAppGuideTopic } from "@/lib/help/in-app-guides";

type InAppGuideHintProps = {
  topic: InAppGuideTopic;
  workspace: HelpWorkspace;
  orgRole?: OrgRole | null;
  className?: string;
};

export function InAppGuideHint({
  topic,
  workspace,
  orgRole,
  className = "",
}: InAppGuideHintProps) {
  return (
    <div className={["mt-3", className].join(" ")}>
      <InAppGuideLink topic={topic} workspace={workspace} orgRole={orgRole} />
    </div>
  );
}