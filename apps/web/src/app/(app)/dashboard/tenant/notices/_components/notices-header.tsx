import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import type { TenantNoticesResult } from "@/app/(app)/dashboard/tenant/notices/_lib/queries";

type NoticesHeaderProps = {
  activeUnit: TenantNoticesResult["leases"][number]["unit"] | null;
};

export function NoticesHeader({ activeUnit }: NoticesHeaderProps) {
  return (
    <SurfaceCard className="p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Tenant Notices
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            Notices
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View notices sent to you and submit your own move-out notice from one
            place.
          </p>
        </div>

        {activeUnit ? (
          <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Current Unit
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {activeUnit.property.name} — {activeUnit.houseNo}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeUnit.building?.name ?? "No building"}
            </p>
          </div>
        ) : (
          <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Lease Status
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              No active lease
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Move-out notices require an active lease
            </p>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}