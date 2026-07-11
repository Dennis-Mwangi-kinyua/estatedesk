import type { OrgRole } from "@prisma/client";
import type { getEtimsReadinessSummary } from "@/lib/tax/etims-client";
import type { TaxesPageData } from "../_lib/types";
import { TaxesAlerts } from "./taxes-alerts";
import { TaxesEtimsPanel } from "./taxes-etims-panel";
import { TaxesGuidance } from "./taxes-guidance";
import { TaxesHeader } from "./taxes-header";
import { TaxesIntegrationsPanel } from "./taxes-integrations-panel";
import { TaxesProfilesPanel } from "./taxes-profiles-panel";
import { TaxesReturnsTable } from "./taxes-returns-table";
import { TaxesStats } from "./taxes-stats";

export function TaxesWorkspace({
  data,
  orgRole,
  etimsReadiness,
}: {
  data: TaxesPageData;
  orgRole?: OrgRole | null;
  etimsReadiness: ReturnType<typeof getEtimsReadinessSummary>;
}) {
  return (
    <div className="org-theme-content ed-mobile-first mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <TaxesHeader orgRole={orgRole} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <TaxesAlerts
            hasKraIntegration={data.hasKraIntegration}
            hasTaxpayerProfile={data.hasTaxpayerProfile}
            hasRentalIncomeReturn={data.hasRentalIncomeReturn}
            taxpayerProfiles={data.taxpayerProfiles}
            integrations={data.integrations}
          />

          <TaxesStats stats={data.stats} />
          <TaxesEtimsPanel readiness={etimsReadiness} />

          <section className="grid gap-4 lg:grid-cols-2">
            <TaxesIntegrationsPanel
              integrations={data.integrations}
              stats={data.stats}
              taxpayerProfiles={data.taxpayerProfiles}
            />
            <TaxesProfilesPanel taxpayerProfiles={data.taxpayerProfiles} />
          </section>

          <TaxesReturnsTable recentReturns={data.recentReturns} />
        </div>

        <TaxesGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}