import Image from "next/image";
import Link from "@/components/navigation/workspace-link";
import { FileText } from "lucide-react";
import type { TenantDashboardUnitImage } from "../_lib/types";
import { panelShellClassName, StatusPill } from "./tenant-dashboard-ui";

type TenantTenancyPanelProps = {
  propertyName?: string | null;
  buildingName?: string | null;
  houseNo?: string | null;
  leaseStatus?: string | null;
  images?: TenantDashboardUnitImage[];
};

function imageUrl(key: string | null | undefined) {
  if (!key) return "/images/og-vacancy.svg";
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

export function TenantTenancyPanel({
  propertyName,
  buildingName,
  houseNo,
  leaseStatus,
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

    </section>
  );
}
