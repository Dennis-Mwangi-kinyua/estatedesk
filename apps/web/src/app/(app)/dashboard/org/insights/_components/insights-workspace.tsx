import type { OrgRole } from "@prisma/client";
import type { InsightsPageData } from "../_lib/types";
import { InsightsDomainHealth } from "./insights-domain-health";
import { InsightsGuidance } from "./insights-guidance";
import { InsightsHeader } from "./insights-header";
import { InsightsRecommendations } from "./insights-recommendations";
import { InsightsStats } from "./insights-stats";

export function InsightsWorkspace({
  data,
  orgRole,
}: {
  data: InsightsPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <InsightsHeader data={data} orgRole={orgRole} />
      <InsightsStats data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <InsightsRecommendations data={data} />
          <InsightsDomainHealth data={data} />
        </div>
        <InsightsGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}