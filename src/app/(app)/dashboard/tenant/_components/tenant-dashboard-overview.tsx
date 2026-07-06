import Image from "next/image";
import { getStatusTone } from "@/lib/tenant/tenant-format";

type TenantDashboardOverviewProps = {
  propertyName?: string | null;
  buildingName?: string | null;
  houseNo?: string | null;
  leaseStatus?: string | null;
  images?: Array<{
    id: string;
    key: string;
    fileName: string;
  }>;
};

function imageUrl(key: string | null | undefined) {
  if (!key) return "/images/og-vacancy.svg";
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

export function TenantDashboardOverview({
  propertyName,
  buildingName,
  houseNo,
  leaseStatus,
  images = [],
}: TenantDashboardOverviewProps) {
  return (
    <div className="xl:col-span-2 rounded-[30px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Overview</p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Account snapshot
          </h2>
        </div>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
          📡 Live data
        </span>
      </div>

      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((asset) => (
            <div
              key={asset.id}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100"
            >
              <Image
                src={imageUrl(asset.key)}
                alt={asset.fileName}
                fill
                sizes="(min-width: 1024px) 16vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] bg-neutral-50 p-4">
          <p className="text-sm font-medium text-muted-foreground">Property</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {propertyName ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">🏠 Assigned property</p>
        </div>

        <div className="rounded-[24px] bg-neutral-50 p-4">
          <p className="text-sm font-medium text-muted-foreground">Building / Block</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {buildingName ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">🧱 Current block</p>
        </div>

        <div className="rounded-[24px] bg-neutral-50 p-4">
          <p className="text-sm font-medium text-muted-foreground">Unit</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {houseNo ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">🚪 Occupied unit</p>
        </div>

        <div className="rounded-[24px] bg-neutral-50 p-4">
          <p className="text-sm font-medium text-muted-foreground">Lease Status</p>
          <div className="mt-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(
                leaseStatus
              )}`}
            >
              📄 {leaseStatus ?? "—"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Current lease state</p>
        </div>
      </div>
    </div>
  );
}
