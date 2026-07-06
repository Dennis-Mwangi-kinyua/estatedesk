"use client";

import { memo, useMemo } from "react";
import { DesktopProfileSections } from "./_components/desktop-profile-sections";
import { MobileEditBar } from "./_components/mobile-edit-bar";
import { MobileProfileSections } from "./_components/mobile-profile-sections";
import { PasswordConfirmModal } from "./_components/password-confirm-modal";
import { ProfileHeader } from "./_components/profile-header";
import {
  getVisibleValue,
  humanizeStatus,
  humanizeTenantType,
  initialsFromName,
} from "./_lib/helpers";
import { useSensitiveReveal } from "./_lib/use-sensitive-reveal";
import type { TenantProfileViewModel } from "./_lib/types";

export type { TenantProfileViewModel } from "./_lib/types";

function TenantProfileView({ tenant }: { tenant: TenantProfileViewModel }) {
  const {
    revealed,
    activeField,
    password,
    submitError,
    isSubmitting,
    activeFieldLabel,
    closeModal,
    handleRequestReveal,
    handlePasswordChange,
    handleConfirmReveal,
  } = useSensitiveReveal();

  const initials = useMemo(
    () => initialsFromName(tenant.fullName),
    [tenant.fullName],
  );
  const statusLabel = useMemo(
    () => humanizeStatus(tenant.status),
    [tenant.status],
  );
  const tenantTypeLabel = useMemo(
    () => humanizeTenantType(tenant.type),
    [tenant.type],
  );

  const phoneValue = useMemo(
    () => getVisibleValue(revealed.phone, "phone", tenant.phone),
    [revealed.phone, tenant.phone],
  );
  const emailValue = useMemo(
    () => getVisibleValue(revealed.email, "email", tenant.email),
    [revealed.email, tenant.email],
  );
  const nationalIdValue = useMemo(
    () => getVisibleValue(revealed.nationalId, "nationalId", tenant.nationalId),
    [revealed.nationalId, tenant.nationalId],
  );
  const kraPinValue = useMemo(
    () => getVisibleValue(revealed.kraPin, "kraPin", tenant.kraPin),
    [revealed.kraPin, tenant.kraPin],
  );
  const nextOfKinPhoneValue = useMemo(
    () =>
      getVisibleValue(
        revealed.nextOfKinPhone,
        "nextOfKinPhone",
        tenant.nextOfKin?.phone,
      ),
    [revealed.nextOfKinPhone, tenant.nextOfKin?.phone],
  );
  const nextOfKinEmailValue = useMemo(
    () =>
      getVisibleValue(
        revealed.nextOfKinEmail,
        "nextOfKinEmail",
        tenant.nextOfKin?.email,
      ),
    [revealed.nextOfKinEmail, tenant.nextOfKin?.email],
  );

  return (
    <>
      <div className="min-h-full bg-[#f2f2f7]">
        <div className="mx-auto w-full max-w-6xl px-3 pb-28 pt-4 sm:px-4 sm:pt-6 lg:px-8 lg:pb-10">
          <div className="mx-auto max-w-3xl lg:max-w-6xl">
            <div className="space-y-4 lg:space-y-6">
              <ProfileHeader
                tenant={tenant}
                initials={initials}
                tenantTypeLabel={tenantTypeLabel}
                statusLabel={statusLabel}
                phoneValue={phoneValue}
                emailValue={emailValue}
                nationalIdValue={nationalIdValue}
                kraPinValue={kraPinValue}
              />

              <MobileProfileSections
                tenant={tenant}
                revealed={revealed}
                tenantTypeLabel={tenantTypeLabel}
                statusLabel={statusLabel}
                onRequestReveal={handleRequestReveal}
              />

              <DesktopProfileSections
                tenant={tenant}
                revealed={revealed}
                tenantTypeLabel={tenantTypeLabel}
                statusLabel={statusLabel}
                phoneValue={phoneValue}
                emailValue={emailValue}
                nationalIdValue={nationalIdValue}
                kraPinValue={kraPinValue}
                nextOfKinPhoneValue={nextOfKinPhoneValue}
                nextOfKinEmailValue={nextOfKinEmailValue}
                onRequestReveal={handleRequestReveal}
              />
            </div>
          </div>
        </div>

        <MobileEditBar />
      </div>

      <PasswordConfirmModal
        isOpen={Boolean(activeField)}
        isSubmitting={isSubmitting}
        password={password}
        setPassword={handlePasswordChange}
        error={submitError}
        fieldLabel={activeFieldLabel}
        onClose={closeModal}
        onSubmit={handleConfirmReveal}
      />
    </>
  );
}

export default memo(TenantProfileView);