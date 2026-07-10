import type { OrgRole } from "@prisma/client";
import type { UnitDetailsViewData } from "../_lib/types";
import { UnitDetailsHeader } from "./unit-details-header";
import { UnitDetailsSidebar } from "./unit-details-sidebar";
import { UnitDetailsSummaryCard } from "./unit-details-summary-card";
import { UnitLeasingPanel } from "./unit-leasing-panel";
import { UnitMaintenancePanel } from "./unit-maintenance-panel";
import { UnitProfilePanel } from "./unit-profile-panel";
import { UnitPropertyContextPanel } from "./unit-property-context-panel";
import { UnitVacancyListingPanel } from "./unit-vacancy-listing-panel";

export function UnitDetailsWorkspace({ data, orgRole }: { data: UnitDetailsViewData; orgRole?: OrgRole | null }) {
  const { unit, currencyCode } = data;
  const currentLease = unit.leases.find((l) => l.status === "ACTIVE") ?? unit.leases.find((l) => l.status === "PENDING") ?? null;
  const totalOpenIssues = unit.issues.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS").length;
  const latestWaterBill = unit.waterBills[0] ?? null;
  const latestMeterReading = unit.meterReadings[0] ?? null;

  return (
    <div className="org-theme-content mx-auto max-w-7xl px-4 pb-24 pt-4">
      <div className="space-y-8">
        <UnitDetailsHeader unit={unit} />
        <UnitDetailsSummaryCard unit={unit} currencyCode={currencyCode} totalOpenIssues={totalOpenIssues} />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            <UnitProfilePanel unit={unit} currencyCode={currencyCode} />
            <UnitVacancyListingPanel unit={unit} currencyCode={currencyCode} orgRole={orgRole} />
            <UnitPropertyContextPanel unit={unit} currencyCode={currencyCode} />
            <UnitLeasingPanel unit={unit} currencyCode={currencyCode} />
            <UnitMaintenancePanel unit={unit} currencyCode={currencyCode} />
          </div>

          <UnitDetailsSidebar
            unit={unit}
            currencyCode={currencyCode}
            currentLease={currentLease}
            latestWaterBill={latestWaterBill}
            latestMeterReading={latestMeterReading}
          />
        </div>
      </div>
    </div>
  );
}