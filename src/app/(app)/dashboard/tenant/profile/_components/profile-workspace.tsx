import { PortalOfficeContact } from "@/components/tenant/portal-office-contact";
import { TenantWorkspace } from "@/components/theme/ed-dashboard-shell";
import type { TenantProfilePageData } from "../_lib/types";
import { AccountSection } from "./account-section";
import { NextOfKinSection } from "./next-of-kin-section";
import { PaymentHealthBanner } from "./payment-health-banner";
import { PersonalInfoSection } from "./personal-info-section";
import { ProfileGuidance } from "./profile-guidance";
import { ProfileHeader } from "./profile-header";
import { ProfileStatusBanner } from "./profile-status-banner";
import { TenancySummarySection } from "./tenancy-summary-section";

export function ProfileWorkspace({ data }: { data: TenantProfilePageData }) {
  const {
    tenant,
    paymentHealth,
    paymentInstructions,
    portalContext,
    showPasswordUpdated,
  } = data;

  return (
    <TenantWorkspace>
      {showPasswordUpdated ? (
        <ProfileStatusBanner message="Your password was updated successfully." />
      ) : null}

      <ProfileHeader tenant={tenant} paymentHealth={paymentHealth} />

      {paymentHealth ? <PaymentHealthBanner paymentHealth={paymentHealth} /> : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <PersonalInfoSection tenant={tenant} />
          <AccountSection tenant={tenant} />
          <NextOfKinSection tenant={tenant} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <TenancySummarySection tenant={tenant} paymentHealth={paymentHealth} />
          <ProfileGuidance />
        </aside>
      </div>

      <PortalOfficeContact
        org={tenant.org}
        paymentInstructions={paymentInstructions}
        caretakerContact={portalContext.caretakerContact}
        layout="strip"
      />
    </TenantWorkspace>
  );
}