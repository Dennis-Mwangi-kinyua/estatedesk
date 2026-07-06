import type { loadPlatformMarketingData } from "../_lib/queries";
import { MarketingLeadsOrgsSection } from "./marketing-leads-orgs-section";
import { MarketingMarketersSection } from "./marketing-marketers-section";

export type MarketingWorkspaceProps = {
  degraded: boolean;
  marketers: Awaited<ReturnType<typeof loadPlatformMarketingData>>["marketers"];
  leads: Awaited<ReturnType<typeof loadPlatformMarketingData>>["leads"];
  organizations: Awaited<ReturnType<typeof loadPlatformMarketingData>>["organizations"];
  unassignedLeads: number;
  unassignedOrgs: number;
  activeMarketers: Awaited<ReturnType<typeof loadPlatformMarketingData>>["marketers"];
  marketerOptions: { id: string; fullName: string; referralCode: string }[];
  attributedLeads: number;
  attributedOrgs: number;
  estimatedMonthlyCommission: number;
};

export function MarketingWorkspace(props: MarketingWorkspaceProps) {
  return (
    <div className="space-y-6">
      <MarketingMarketersSection {...props} />
      <MarketingLeadsOrgsSection {...props} />
    </div>
  );
}