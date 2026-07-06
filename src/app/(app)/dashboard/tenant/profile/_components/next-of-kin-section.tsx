import { maskEmail, maskPhone } from "../_lib/helpers";
import type { getTenantProfileData } from "../_lib/queries";
import { InfoRow } from "./info-row";

type NextOfKinSectionProps = {
  tenant: NonNullable<Awaited<ReturnType<typeof getTenantProfileData>>["tenant"]>;
};

export function NextOfKinSection({ tenant }: NextOfKinSectionProps) {
  return (
    <section className="rounded-[28px] border border-neutral-200/80 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur sm:p-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Next of Kin</p>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Emergency contact on file
        </h2>
      </div>

      {!tenant.nextOfKin ? (
        <div className="mt-4 rounded-[22px] bg-neutral-50/90 p-4 text-sm text-muted-foreground ring-1 ring-neutral-200/70">
          No next of kin information has been added yet.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoRow label="Name" value={tenant.nextOfKin.name} />
          <InfoRow label="Relationship" value={tenant.nextOfKin.relationship} />
          <InfoRow
            label="Phone"
            value={tenant.nextOfKin.phone ?? ""}
            maskedValue={maskPhone(tenant.nextOfKin.phone)}
            reveal
          />
          <InfoRow
            label="Email"
            value={tenant.nextOfKin.email ?? ""}
            maskedValue={maskEmail(tenant.nextOfKin.email)}
            reveal
          />
        </div>
      )}
    </section>
  );
}