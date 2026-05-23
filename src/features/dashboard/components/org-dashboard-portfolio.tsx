import { Activity, ShieldCheck } from "lucide-react";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import {
  Badge,
  MiniStat,
  ProgressCard,
  RingCard,
  SectionCard,
} from "./org-dashboard-shared";

export function OrgDashboardPortfolio({
  data,
}: {
  data: OrgDashboardSummary;
}) {
  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge tone="neutral">
                <Activity className="h-3.5 w-3.5" />
                Portfolio performance
              </Badge>
              <h2 className="mt-4 text-xl font-semibold text-neutral-950">
                Occupancy, buildings, and portfolio distribution
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-neutral-500">
                A quick view of how the organization is performing across inventory,
                occupancy, and physical asset structure.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 lg:w-auto lg:min-w-[170px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                Properties / Buildings
              </p>
              <p className="mt-2 text-2xl font-semibold text-neutral-950">
                {data.totalProperties} / {data.totalBuildings}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ProgressCard
              label="Occupancy rate"
              value={data.occupiedUnits}
              total={data.totalUnits}
              helper={`${data.occupiedUnits} occupied and ${data.vacantUnits} vacant units`}
            />
            <ProgressCard
              label="Apartment mix"
              value={data.totalApartments}
              total={data.totalUnits}
              helper={`${data.totalApartments} apartments across ${data.totalUnits} total units`}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat label="Total Units" value={data.totalUnits} helper="Active inventory" />
            <MiniStat
              label="Occupied"
              value={data.occupiedUnits}
              helper="Income-generating units"
            />
            <MiniStat label="Vacant" value={data.vacantUnits} helper="Available for leasing" />
            <MiniStat
              label="Vacancy Rate"
              value={`${data.vacancyRate}%`}
              helper="Portfolio gap to close"
            />
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RingCard
          label="Issue pressure"
          value={data.issuePressure}
          sublabel={`${data.urgentIssues} urgent out of ${data.openIssues} open maintenance tickets`}
        />

        <SectionCard className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <ShieldCheck className="h-4 w-4" />
            Team coverage
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniStat
              label="Employees"
              value={data.totalEmployees}
              helper="Internal organization staff"
            />
            <MiniStat
              label="Caretakers"
              value={data.totalCaretakers}
              helper="Users with caretaker role"
            />
            <MiniStat
              label="Assignments"
              value={data.activeCaretakerAssignments}
              helper="Currently active caretaker assignments"
            />
            <MiniStat label="Leases" value={data.activeLeases} helper="Live lease records" />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}