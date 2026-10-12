import type { ReactNode } from "react";
import type { OrgRole } from "@prisma/client";
import type { TenantDetailsData } from "../_lib/types";
import { TenantHeroCard, getInitials, formatCurrency } from "./tenant-details-ui";
import { TenantDetailsMainColumn } from "./tenant-details-main-column";
import { TenantDetailsSidebarColumn } from "./tenant-details-sidebar-column";

export function TenantDetailsWorkspace({
  data,
  initialCharges,
}: {
  data: TenantDetailsData;
  orgRole?: OrgRole | null;
  initialCharges?: ReactNode;
}) {
  const { tenant, canManage, hasActiveLease, isDeleted, isBlacklisted, isArchived, currentUnit, currentRent, currentDeposit, totalPayments } = data;
  return (
    <div className="org-theme-content mx-auto w-full min-w-0 max-w-7xl px-0 pb-24 pt-2 sm:px-2">
      <div className="space-y-5">
        <TenantHeroCard
          fullName={tenant.fullName}
          status={tenant.status}
          type={tenant.type}
          email={tenant.email}
          phone={tenant.phone}
          currentUnit={currentUnit}
          currentRent={currentRent}
          currentDeposit={currentDeposit}
          recordedPayments={formatCurrency(totalPayments)}
          canManage={canManage}
          initials={getInitials(tenant.fullName)}
          tenantId={tenant.id}
          hasActiveLease={hasActiveLease}
          isDeleted={isDeleted}
          isBlacklisted={isBlacklisted}
          isArchived={isArchived}
        />

        {initialCharges}

        <div className="grid min-w-0 items-start gap-5 min-[1600px]:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <TenantDetailsMainColumn data={data} />
          <TenantDetailsSidebarColumn data={data} />
        </div>
      </div>
    </div>
  );
}