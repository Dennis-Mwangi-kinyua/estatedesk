import Image from "next/image";
import Link from "next/link";
import { Building2, DoorOpen, FileText } from "lucide-react";
import type { TenantDashboardUnitImage } from "../_lib/types";
import { panelShellClassName, StatusPill, SummaryMetric } from "./tenant-dashboard-ui";

type TenantTenancyPanelProps = {
  propertyName?: string | null;
  buildingName?: string | null;
  houseNo?: string | null;
  leaseStatus?: string | null;
  monthlyRent?: unknown;
  dueDay?: number | null;
  images?: TenantDashboardUnitImage[];
};

function imageUrl(key: string | null | undefined) {
  if (!key) return "/images/og-vacancy.svg";
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function TenantTenancyPanel({
  propertyName,
  buildingName,
  houseNo,
  leaseStatus,
  monthlyRent,
  dueDay,
  images = [],
}: TenantTenancyPanelProps) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Current tenancy
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {propertyName ?? "No property assigned"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {buildingName ? `${buildingName} • ` : ""}
              Unit {houseNo ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={leaseStatus} />
            <Link
              href="/dashboard/tenant/lease"
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <FileText className="h-4 w-4" />
              Lease details
            </Link>
          </div>
        </div>
      </div>

      {images.length > 0 ? (
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((asset) => (
              <div
                key={asset.id}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted/20"
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
        </div>
      ) : null}

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <SummaryMetric
          label="Property"
          value={propertyName ?? "—"}
          note="Assigned property"
        />
        <SummaryMetric
          label="Building"
          value={buildingName ?? "Not assigned"}
          note="Current block"
        />
        <SummaryMetric
          label="Unit"
          value={houseNo ?? "—"}
          note="Occupied unit"
        />
        <SummaryMetric
          label="Monthly rent"
          value={formatMoney(monthlyRent)}
          note={dueDay ? `Due on day ${dueDay}` : "Rent schedule"}
        />
      </div>

      <div className="border-t border-border px-5 py-4 sm:px-6">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {propertyName ?? "Property pending"}
          </span>
          <span className="inline-flex items-center gap-2">
            <DoorOpen className="h-4 w-4" />
            Unit {houseNo ?? "—"}
          </span>
        </div>
      </div>
    </section>
  );
}