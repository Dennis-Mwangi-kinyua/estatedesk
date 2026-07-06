import { InAppGuideHub } from "@/components/help/in-app-guide-hub";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { HelpWorkspace } from "./_components/help-workspace";

export const dynamic = "force-dynamic";

export default async function CaretakerHelpPage() {
  const session = await requireCaretakerAccess();

  return (
    <HelpWorkspace>
      <InAppGuideHub workspace="caretaker" orgRole={session.activeOrgRole} />
    </HelpWorkspace>
  );
}