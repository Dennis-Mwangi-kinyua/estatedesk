import { maskEmail, maskPhone, maskText } from "../_lib/helpers";
import type { getTenantProfileData } from "../_lib/queries";
import { InfoRow } from "./info-row";

type ContactInfoGridProps = {
  tenant: NonNullable<Awaited<ReturnType<typeof getTenantProfileData>>["tenant"]>;
};

export function ContactInfoGrid({ tenant }: ContactInfoGridProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
    </section>
  );
}