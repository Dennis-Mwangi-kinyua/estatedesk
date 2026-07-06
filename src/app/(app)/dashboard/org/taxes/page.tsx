import { requireManagementAccess } from "@/lib/permissions/guards";
import { loadTaxesPageData } from "./_lib/queries";
import { TaxesWorkspace } from "./_components/taxes-workspace";

export const dynamic = "force-dynamic";

export default async function TaxesPage() {
  const session = await requireManagementAccess();
  const data = await loadTaxesPageData();

  return <TaxesWorkspace data={data} orgRole={session.activeOrgRole} />;
}