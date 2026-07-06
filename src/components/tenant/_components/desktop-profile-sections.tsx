"use client";

import Link from "next/link";
import { memo } from "react";
import { PencilLine } from "lucide-react";
import { displayValue } from "../_lib/helpers";
import type { RevealState, SensitiveFieldKey, TenantProfileViewModel } from "../_lib/types";
import { DesktopField } from "./desktop-field";

export const DesktopProfileSections = memo(function DesktopProfileSections({
  tenant,
  revealed,
  tenantTypeLabel,
  statusLabel,
  phoneValue,
  emailValue,
  nationalIdValue,
  kraPinValue,
  nextOfKinPhoneValue,
  nextOfKinEmailValue,
  onRequestReveal,
}: {
  tenant: TenantProfileViewModel;
  revealed: RevealState;
  tenantTypeLabel: string;
  statusLabel: string;
  phoneValue: string;
  emailValue: string;
  nationalIdValue: string;
  kraPinValue: string;
  nextOfKinPhoneValue: string;
  nextOfKinEmailValue: string;
  onRequestReveal: (field: SensitiveFieldKey) => void;
}) {
  return (
    <div className="hidden gap-6 lg:grid lg:grid-cols-12">
      <section className="col-span-7 overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Personal Information
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Account and identity details associated with this tenant profile.
            </p>
          </div>

          <Link
            href="/dashboard/tenant/profile/edit"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-neutral-50"
          >
            <PencilLine className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <DesktopField
            label="Full Name"
            value={displayValue(tenant.fullName)}
          />
          <DesktopField label="Tenant Type" value={tenantTypeLabel} />
          <DesktopField
            label="Phone"
            value={phoneValue}
            isSensitive
            revealed={revealed.phone}
            onReveal={() => onRequestReveal("phone")}
          />
          <DesktopField
            label="Email"
            value={emailValue}
            isSensitive
            revealed={revealed.email}
            onReveal={() => onRequestReveal("email")}
          />
          <DesktopField
            label="National ID"
            value={nationalIdValue}
            isSensitive
            revealed={revealed.nationalId}
            onReveal={() => onRequestReveal("nationalId")}
          />
          <DesktopField
            label="KRA PIN"
            value={kraPinValue}
            isSensitive
            revealed={revealed.kraPin}
            onReveal={() => onRequestReveal("kraPin")}
          />
          <DesktopField label="Status" value={statusLabel} />
          <DesktopField
            label="Data Consent"
            value={tenant.dataConsent ? "Granted" : "Not granted"}
          />
          <DesktopField
            label="Marketing Consent"
            value={tenant.marketingConsent ? "Granted" : "Not granted"}
          />
          {tenant.type === "COMPANY" ? (
            <DesktopField
              label="Company Name"
              value={displayValue(tenant.companyName)}
            />
          ) : null}
        </div>
      </section>

      <section className="col-span-5 overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
        <div className="border-b border-neutral-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-foreground">Next of Kin</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Emergency contact information on file.
          </p>
        </div>

        <div className="space-y-4 p-6">
          {tenant.nextOfKin ? (
            <>
              <DesktopField
                label="Name"
                value={displayValue(tenant.nextOfKin.name)}
              />
              <DesktopField
                label="Relationship"
                value={displayValue(tenant.nextOfKin.relationship)}
              />
              <DesktopField
                label="Phone"
                value={nextOfKinPhoneValue}
                isSensitive
                revealed={revealed.nextOfKinPhone}
                onReveal={() => onRequestReveal("nextOfKinPhone")}
              />
              <DesktopField
                label="Email"
                value={nextOfKinEmailValue}
                isSensitive
                revealed={revealed.nextOfKinEmail}
                onReveal={() => onRequestReveal("nextOfKinEmail")}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-muted-foreground">
              No next of kin details added yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
});