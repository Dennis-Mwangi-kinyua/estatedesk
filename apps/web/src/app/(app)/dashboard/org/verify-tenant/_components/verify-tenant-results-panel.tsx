import type { VerifyTenantPageData } from "../_lib/types";
import { VerifyTenantResultCard } from "./verify-tenant-result-card";

export function VerifyTenantResultsPanel({
  results,
  activeOrgId,
  search,
}: {
  results: VerifyTenantPageData["results"];
  activeOrgId: string;
  search: VerifyTenantPageData["search"];
}) {
  return (
    <div className="space-y-4">
      {results.map((tenant) => (
        <VerifyTenantResultCard
          key={tenant.id}
          tenant={tenant}
          activeOrgId={activeOrgId}
          search={search}
        />
      ))}
    </div>
  );
}
