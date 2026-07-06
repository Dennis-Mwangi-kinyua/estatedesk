import { PushNotificationSettingsPanel } from "@/components/pwa/push-notification-settings-panel";
import type { getTenantProfileData } from "../_lib/queries";
import { ContactInfoGrid } from "./contact-info-grid";
import { NextOfKinSection } from "./next-of-kin-section";
import { PaymentHealthBanner } from "./payment-health-banner";
import { PersonalInfoSection } from "./personal-info-section";
import { ProfileHeader } from "./profile-header";

type ProfileWorkspaceProps = {
  tenant: NonNullable<Awaited<ReturnType<typeof getTenantProfileData>>["tenant"]>;
  paymentHealth: Awaited<ReturnType<typeof getTenantProfileData>>["paymentHealth"];
};

export function ProfileWorkspace({ tenant, paymentHealth }: ProfileWorkspaceProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <ProfileHeader tenant={tenant} paymentHealth={paymentHealth} />

      {paymentHealth ? <PaymentHealthBanner paymentHealth={paymentHealth} /> : null}

      <ContactInfoGrid tenant={tenant} />

      <PersonalInfoSection tenant={tenant} />

      <PushNotificationSettingsPanel />

      <NextOfKinSection tenant={tenant} />
    </div>
  );
}