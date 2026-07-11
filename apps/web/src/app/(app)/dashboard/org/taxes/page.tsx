import { requireManagementAccess } from "@/lib/permissions/guards";
import { getEtimsReadinessSummary } from "@/lib/tax/etims-client";
import { loadTaxesPageData } from "./_lib/queries";
import { TaxesWorkspace } from "./_components/taxes-workspace";

export const dynamic = "force-dynamic";

export default async function TaxesPage() {
  const session = await requireManagementAccess();
  const [data, etimsReadiness] = await Promise.all([
    loadTaxesPageData(),
    Promise.resolve(getEtimsReadinessSummary()),
  ]);

  return (
    <TaxesWorkspace
      data={data}
      orgRole={session.activeOrgRole}
      etimsReadiness={etimsReadiness}
    />
  );
}