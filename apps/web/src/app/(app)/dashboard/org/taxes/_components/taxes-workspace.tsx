import type { KraIntegration, OrgRole } from "@prisma/client";
import type { TaxesPageData } from "../_lib/types";
import { TaxesAlerts } from "./taxes-alerts";
import { TaxesEtimsPanel } from "./taxes-etims-panel";
import { TaxesEtimsSettingsForm } from "./taxes-etims-settings-form";
import { TaxesGuidance } from "./taxes-guidance";
import { TaxesHeader } from "./taxes-header";
import { TaxesIntegrationsPanel } from "./taxes-integrations-panel";
import { TaxesProfilesPanel } from "./taxes-profiles-panel";
import { TaxesReturnsTable } from "./taxes-returns-table";
import { TaxesStats } from "./taxes-stats";

type EtimsReadiness = {
  configured: boolean;
  environment: string;
  baseUrl: string | null;
  controlUnitSerial: string | null;
  notes: string[];
  statusLabel: string;
};

type IntegrationSettings = Pick<
  KraIntegration,
  | "environment"
  | "filingMode"
  | "status"
  | "clientId"
  | "clientSecretCiphertext"
  | "webhookSecretCiphertext"
  | "apiBaseUrl"
  | "eritsBaseUrl"
  | "controlUnitSerial"
  | "branchOfficeId"
  | "lastSyncAt"
  | "lastError"
>;

export function TaxesWorkspace({
  data,
  orgRole,
  etimsReadiness,
  orgIntegration,
}: {
  data: TaxesPageData;
  orgRole?: OrgRole | null;
  etimsReadiness: EtimsReadiness;
  orgIntegration: IntegrationSettings | null;
}) {
  const canEditEtims = orgRole === "ADMIN" || orgRole === "ACCOUNTANT";

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
          {canEditEtims ? (
            <TaxesEtimsSettingsForm integration={orgIntegration} />
          ) : null}

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