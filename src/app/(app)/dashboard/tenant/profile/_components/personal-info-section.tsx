import {
  maskEmail,
  maskPhone,
  maskText,
  statusTone,
  yesNoTone,
} from "../_lib/helpers";
import type { getTenantProfileData } from "../_lib/queries";
import { InfoRow } from "./info-row";
import { SummaryTile } from "./summary-tile";

type PersonalInfoSectionProps = {
  tenant: NonNullable<Awaited<ReturnType<typeof getTenantProfileData>>["tenant"]>;
};

export function PersonalInfoSection({ tenant }: PersonalInfoSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="xl:col-span-2 rounded-[28px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur sm:p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Personal Information</p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Account and identity details
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoRow label="Full Name" value={tenant.fullName} />
          <InfoRow
            label="Tenant Type"
            value={tenant.type === "COMPANY" ? "Company" : "Individual"}
          />
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

          <div className="rounded-[22px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] backdrop-blur">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Status
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone(
                  tenant.status,
                )}`}
              >
                {tenant.status}
              </span>
            </div>
          </div>

          <div className="rounded-[22px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] backdrop-blur">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Data Consent
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${yesNoTone(
                  tenant.dataConsent,
                )}`}
              >
                {tenant.dataConsent ? "Granted" : "Not granted"}
              </span>
            </div>
          </div>

          <div className="rounded-[22px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] backdrop-blur sm:col-span-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Marketing Consent
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${yesNoTone(
                  tenant.marketingConsent,
                )}`}
              >
                {tenant.marketingConsent ? "Granted" : "Not granted"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur sm:p-5">
        <p className="text-sm font-medium text-muted-foreground">Quick Summary</p>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Profile snapshot
        </h2>

        <div className="mt-4 space-y-3">
          <SummaryTile label="Profile Name" value={tenant.fullName} />
          <SummaryTile
            label="Tenant Category"
            value={tenant.type === "COMPANY" ? "Company" : "Individual"}
          />
          <SummaryTile label="Profile Status" value={tenant.status} />
          <SummaryTile
            label="Data Consent"
            value={tenant.dataConsent ? "Granted" : "Not granted"}
          />
        </div>
      </div>
    </section>
  );
}