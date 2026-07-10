import type { OrgRole } from "@prisma/client";
import type { VerifyTenantPageData } from "../_lib/types";
import { VerifyTenantGuidance } from "./verify-tenant-guidance";
import { VerifyTenantHeader } from "./verify-tenant-header";
import { VerifyTenantResultsPanel } from "./verify-tenant-results-panel";
import { VerifyTenantSearchPanel } from "./verify-tenant-search-panel";
import { VerifyTenantTransferRequestsPanel } from "./verify-tenant-transfer-requests-panel";

export function VerifyTenantWorkspace({ data, activeOrgId, orgRole }: { data: VerifyTenantPageData; activeOrgId: string; orgRole?: OrgRole | null }) {
  const { search, canSearch, results, incomingTransferRequests, currentOrgResults, otherOrgResults, hasResults } = data;
  return (
    <div className="org-theme-content mx-auto max-w-7xl px-4 pb-24 pt-4">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <VerifyTenantHeader orgRole={orgRole} />
          <VerifyTenantTransferRequestsPanel incomingTransferRequests={incomingTransferRequests} />
          <VerifyTenantSearchPanel
            search={search}
            canSearch={canSearch}
            results={results}
            currentOrgResults={currentOrgResults}
            otherOrgResults={otherOrgResults}
            hasResults={hasResults}
          />
          {hasResults ? (
            <VerifyTenantResultsPanel results={results} activeOrgId={activeOrgId} search={search} />
          ) : null}
        </div>

        <VerifyTenantGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}