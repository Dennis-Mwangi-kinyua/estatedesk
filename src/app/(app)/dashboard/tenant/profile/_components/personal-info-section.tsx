import {
  maskEmail,
  maskPhone,
  maskText,
  statusTone,
  yesNoTone,
} from "../_lib/helpers";
import type { TenantProfileRecord } from "../_lib/types";
import { InfoRow } from "./info-row";
import { panelShellClassName } from "./profile-ui";

export function PersonalInfoSection({ tenant }: { tenant: TenantProfileRecord }) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Identity
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Personal information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Contact and identity details on file with the property office.
        </p>
      </div>

      <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
        <div className="divide-y divide-border sm:col-span-2 sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <InfoRow label="Full name" value={tenant.fullName} />
          <InfoRow
            label="Tenant type"
            value={tenant.type === "COMPANY" ? "Company" : "Individual"}
          />
          {tenant.companyName ? (
            <InfoRow label="Company name" value={tenant.companyName} />
          ) : null}
          <InfoRow
            label="Phone"
            value={tenant.phone ?? ""}
            maskedValue={maskPhone(tenant.phone)}
            reveal
          />
          <InfoRow
            label="Email"
            value={tenant.email ?? ""}
            maskedValue={maskEmail(tenant.email)}
            reveal
          />
          <InfoRow
            label="National ID"
            value={tenant.nationalId ?? ""}
            maskedValue={maskText(tenant.nationalId, 0, 2)}
            reveal
          />
          <InfoRow
            label="KRA PIN"
            value={tenant.kraPin ?? ""}
            maskedValue={maskText(tenant.kraPin, 1, 2)}
            reveal
          />
        </div>
      </div>

      <div className="border-t border-border px-5 py-4 sm:px-6">
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Status
            </p>
            <span
              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(
                tenant.status,
              )}`}
            >
              {tenant.status}
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Data consent
            </p>
            <span
              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${yesNoTone(
                tenant.dataConsent,
              )}`}
            >
              {tenant.dataConsent ? "Granted" : "Not granted"}
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Marketing consent
            </p>
            <span
              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${yesNoTone(
                tenant.marketingConsent,
              )}`}
            >
              {tenant.marketingConsent ? "Granted" : "Not granted"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}