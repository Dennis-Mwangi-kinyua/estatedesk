import type { ReactNode } from "react";
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

export function ProfileWorkspace({ data, profilePicture }: { data: TenantProfilePageData; profilePicture?: ReactNode }) {
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

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-2 [&>section]:h-full">
        <PersonalInfoSection tenant={tenant} />
        {profilePicture}
        <AccountSection tenant={tenant} />
        <TenancySummarySection tenant={tenant} paymentHealth={paymentHealth} />
        <NextOfKinSection tenant={tenant} />
      </div>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-2">
      <ProfileGuidance />
      <PortalOfficeContact
        org={tenant.org}
        paymentInstructions={paymentInstructions}
        caretakerContact={portalContext.caretakerContact}
        layout="compact"
      />
      </div>
    </TenantWorkspace>
  );
}