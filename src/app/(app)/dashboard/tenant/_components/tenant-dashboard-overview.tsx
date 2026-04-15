import { getStatusTone } from "@/lib/tenant/tenant-format";

type TenantDashboardOverviewProps = {
  propertyName?: string | null;
  buildingName?: string | null;
  houseNo?: string | null;
  leaseStatus?: string | null;
};

export function TenantDashboardOverview({
  propertyName,
  buildingName,
  houseNo,
  leaseStatus,
}: TenantDashboardOverviewProps) {
  return (
    <div className="xl:col-span-2 rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-500">Overview</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
            Account snapshot
          </h2>
        </div>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
          📡 Live data
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-500">Property</p>
          <p className="mt-2 text-lg font-semibold text-neutral-950">
            {propertyName ?? "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">🏠 Assigned property</p>
        </div>

        <div className="rounded-[24px] bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-500">Building / Block</p>
          <p className="mt-2 text-lg font-semibold text-neutral-950">
            {buildingName ?? "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">🧱 Current block</p>
        </div>

        <div className="rounded-[24px] bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-500">Unit</p>
          <p className="mt-2 text-lg font-semibold text-neutral-950">
            {houseNo ?? "—"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">🚪 Occupied unit</p>
        </div>

        <div className="rounded-[24px] bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-500">Lease Status</p>
          <div className="mt-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(
                leaseStatus
              )}`}
            >
              📄 {leaseStatus ?? "—"}
            </span>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Current lease state</p>
        </div>
      </div>
    </div>
  );
}