import { InAppGuideHub } from "@/components/help/in-app-guide-hub";
import { requireTenantAccess } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

export default async function TenantHelpPage() {
  const session = await requireTenantAccess();

  return (
    <InAppGuideHub workspace="tenant" orgRole={session.activeOrgRole} />
  );
}