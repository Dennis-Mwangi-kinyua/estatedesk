import type { OrgRole } from "@prisma/client";
import type { TenantDetailsData } from "../_lib/types";
import { TenantHeroCard, getInitials } from "./tenant-details-ui";
import { TenantDetailsMainColumn } from "./tenant-details-main-column";
import { TenantDetailsSidebarColumn } from "./tenant-details-sidebar-column";

export function TenantDetailsWorkspace({
  data,
  orgRole,
}: {
  data: TenantDetailsData;
  orgRole?: OrgRole | null;
}) {
  const { tenant, canManage, hasActiveLease, isDeleted, isBlacklisted, isArchived, currentUnit, currentRent } = data;
  return (
    <div className="org-theme-content mx-auto max-w-7xl px-4 pb-24 pt-4">
      <div className="space-y-5">
        <TenantHeroCard
          fullName={tenant.fullName}
          status={tenant.status}
          type={tenant.type}
          email={tenant.email}
          phone={tenant.phone}
          currentUnit={currentUnit}
          currentRent={currentRent}
          canManage={canManage}
          initials={getInitials(tenant.fullName)}
          tenantId={tenant.id}
          hasActiveLease={hasActiveLease}
          isDeleted={isDeleted}
          isBlacklisted={isBlacklisted}
          isArchived={isArchived}
        />

        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
          <TenantDetailsMainColumn data={data} />
          <TenantDetailsSidebarColumn data={data} />
        </div>
      </div>
    </div>
  );
}