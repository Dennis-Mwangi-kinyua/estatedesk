"use client";

import { memo } from "react";
import { displayValue } from "../_lib/helpers";
import type { RevealState, SensitiveFieldKey, TenantProfileViewModel } from "../_lib/types";
import { IOSDivider, IOSGroup, IOSRow } from "./ios-primitives";
import { SensitiveValueButton } from "./sensitive-value-button";

export const MobileProfileSections = memo(function MobileProfileSections({
  tenant,
  revealed,
  tenantTypeLabel,
  statusLabel,
  onRequestReveal,
}: {
  tenant: TenantProfileViewModel;
  revealed: RevealState;
  tenantTypeLabel: string;
  statusLabel: string;
  onRequestReveal: (field: SensitiveFieldKey) => void;
}) {
  return (
    <div className="space-y-5 lg:hidden">
      <IOSGroup title="Account">
        <IOSRow
          label="Full Name"
          value={displayValue(tenant.fullName)}
          href="/dashboard/tenant/profile/edit"
          emoji="👤"
        />
        <IOSDivider />
        <IOSRow label="Tenant Type" value={tenantTypeLabel} emoji="🏠" />
        <IOSDivider />
        <SensitiveValueButton
          label="Phone"
          value={tenant.phone}
          fieldKey="phone"
          revealed={revealed.phone}
          onRequestReveal={onRequestReveal}
          emoji="📞"
        />
        <IOSDivider />
        <SensitiveValueButton
          label="Email"
          value={tenant.email}
          fieldKey="email"
          revealed={revealed.email}
          onRequestReveal={onRequestReveal}
          emoji="✉️"
        />
        <IOSDivider />
        <IOSRow label="Status" value={statusLabel} emoji="✅" />
      </IOSGroup>

      <IOSGroup title="Identity">
        <SensitiveValueButton
          label="National ID"
          value={tenant.nationalId}
          fieldKey="nationalId"
          revealed={revealed.nationalId}
          onRequestReveal={onRequestReveal}
          emoji="🪪"
        />
        <IOSDivider />
        <SensitiveValueButton
          label="KRA PIN"
          value={tenant.kraPin}
          fieldKey="kraPin"
          revealed={revealed.kraPin}
          onRequestReveal={onRequestReveal}
          emoji="🧾"
        />
        {tenant.type === "COMPANY" ? (
          <>
            <IOSDivider />
            <IOSRow
              label="Company Name"
              value={displayValue(tenant.companyName)}
              emoji="🏢"
            />
          </>
        ) : null}
      </IOSGroup>

      <IOSGroup title="Preferences">
        <IOSRow
          label="Data Consent"
          value={tenant.dataConsent ? "Granted" : "Not granted"}
          emoji="🔒"
        />
        <IOSDivider />
        <IOSRow
          label="Marketing Consent"
          value={tenant.marketingConsent ? "Granted" : "Not granted"}
          emoji="📣"
        />
      </IOSGroup>

      <IOSGroup title="Next of Kin">
        {tenant.nextOfKin ? (
          <>
            <IOSRow
              label="Name"
              value={displayValue(tenant.nextOfKin.name)}
              emoji="🧑‍🤝‍🧑"
            />
            <IOSDivider />
            <IOSRow
              label="Relationship"
              value={displayValue(tenant.nextOfKin.relationship)}
              emoji="💛"
            />
            <IOSDivider />
            <SensitiveValueButton
              label="Phone"
              value={tenant.nextOfKin.phone}
              fieldKey="nextOfKinPhone"
              revealed={revealed.nextOfKinPhone}
              onRequestReveal={onRequestReveal}
              emoji="📱"
            />
            <IOSDivider />
            <SensitiveValueButton
              label="Email"
              value={tenant.nextOfKin.email}
              fieldKey="nextOfKinEmail"
              revealed={revealed.nextOfKinEmail}
              onRequestReveal={onRequestReveal}
              emoji="📧"
            />
          </>
        ) : (
          <div className="px-4 py-5 text-[15px] text-muted-foreground">
            No next of kin details added yet.
          </div>
        )}
      </IOSGroup>
    </div>
  );
});