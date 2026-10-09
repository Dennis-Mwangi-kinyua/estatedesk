import { PortalOfficeContact } from "@/components/tenant/portal-office-contact";
import { TenantWorkspace } from "@/components/theme/ed-dashboard-shell";
import { PaymentHealthBanner } from "../profile/_components/payment-health-banner";
import type { TenantDashboardActiveData } from "../_lib/types";
import { PendingSignatureBanner } from "./pending-signature-banner";
import { TenantDashboardGuidance } from "./tenant-dashboard-guidance";
import { TenantDashboardHeader } from "./tenant-dashboard-header";
import { TenantDashboardPayments } from "./tenant-dashboard-payments";
import { TenantDashboardQuickActions } from "./tenant-dashboard-quick-actions";
import { TenantDashboardUpdates } from "./tenant-dashboard-updates";
import { TenantTenancyPanel } from "./tenant-tenancy-panel";

export function TenantDashboardWorkspace({ data }: { data: TenantDashboardActiveData }) {
  const {
    fullName,
    propertyName,
    buildingName,
    houseNo,
    leaseStatus,
    monthlyRent,
    dueDay,
    images,
    recentPayments,
    notifications,
    issues,
    portalContext,
  } = data;

  const openIssuesCount = issues.filter(
    (issue) => issue.status !== "RESOLVED" && issue.status !== "CLOSED",
  ).length;

  return (
    <TenantWorkspace>
      {portalContext.pendingLeaseSignatures.length > 0 ? (
        <PendingSignatureBanner
          pendingSignatures={portalContext.pendingLeaseSignatures}
        />
      ) : null}

      {portalContext.paymentHealth ? (
        <PaymentHealthBanner paymentHealth={portalContext.paymentHealth} />
      ) : null}

      <TenantDashboardHeader
        fullName={fullName}
        organizationName={portalContext.tenant?.org.name ?? "Organisation"}
        propertyName={propertyName}
        buildingName={buildingName}
        houseNo={houseNo}
        leaseStatus={leaseStatus}
        monthlyRent={monthlyRent}
        dueDay={dueDay}
        openIssuesCount={openIssuesCount}
        unreadNotificationCount={portalContext.unreadNotificationCount}
        portalContext={portalContext}
      />

      <TenantDashboardQuickActions />

      <TenantTenancyPanel
        propertyName={propertyName}
        buildingName={buildingName}
        houseNo={houseNo}
        leaseStatus={leaseStatus}
        monthlyRent={monthlyRent}
        dueDay={dueDay}
        images={images}
      />

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-2 [&>section]:h-full">
        <TenantDashboardPayments recentPayments={recentPayments} />
        <TenantDashboardUpdates notifications={notifications} issues={issues} />
      </div>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-2">
        <TenantDashboardGuidance />
        {portalContext.tenant ? (
          <PortalOfficeContact
            org={portalContext.tenant.org}
            paymentInstructions={portalContext.paymentInstructions}
            caretakerContact={portalContext.caretakerContact}
            layout="compact"
          />
        ) : null}
      </div>
    </TenantWorkspace>
  );
}
