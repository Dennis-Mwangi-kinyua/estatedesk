import { InAppGuideHub } from "@/components/help/in-app-guide-hub";
import { requireManagementAccess } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

export default async function OrgHelpPage() {
  const session = await requireManagementAccess();

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <InAppGuideHub workspace="org" orgRole={session.activeOrgRole} />
    </div>
  );
}