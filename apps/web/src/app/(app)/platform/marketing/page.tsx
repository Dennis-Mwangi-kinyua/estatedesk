import { requirePlatformRole } from "@/lib/permissions/guards";
import { estimateMonthlyCommission } from "./_lib/helpers";
import { loadPlatformMarketingData } from "./_lib/queries";
import { MarketingWorkspace } from "./_components/marketing-workspace";

export const dynamic = "force-dynamic";

export default async function PlatformMarketingPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const {
    degraded,
    marketers,
    leads,
    organizations,
    unassignedLeads,
    unassignedOrgs,
  } = await loadPlatformMarketingData();

  const activeMarketers = marketers.filter(
    (marketer) => marketer.status === "ACTIVE" && marketer.deletedAt === null,
  );
  const marketerOptions = marketers
    .filter((marketer) => marketer.deletedAt === null)
    .map((marketer) => ({
      id: marketer.id,
      fullName:
        marketer.status === "ACTIVE"
          ? marketer.fullName
          : `${marketer.fullName} (inactive)`,
      referralCode: marketer.referralCode,
    }));
  const attributedLeads = leads.filter((lead) => lead.marketerId).length;
  const attributedOrgs = organizations.filter((org) => org.marketerId).length;
  const estimatedMonthlyCommission = organizations.reduce((sum, org) => {
    return (
      sum +
      estimateMonthlyCommission({
        plan: org.subscription?.plan ?? null,
        rate: org.commissionRate,
      })
    );
  }, 0);

  return (
    <MarketingWorkspace
      degraded={degraded}
      marketers={marketers}
      leads={leads}
      organizations={organizations}
      unassignedLeads={unassignedLeads}
      unassignedOrgs={unassignedOrgs}
      activeMarketers={activeMarketers}
      marketerOptions={marketerOptions}
      attributedLeads={attributedLeads}
      attributedOrgs={attributedOrgs}
      estimatedMonthlyCommission={estimatedMonthlyCommission}
    />
  );
}
