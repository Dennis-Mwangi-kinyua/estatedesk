import Link from "next/link";
import { PencilLine } from "lucide-react";
import { maskEmail, maskPhone } from "../_lib/helpers";
import type { TenantProfileRecord } from "../_lib/types";
import { InfoRow } from "./info-row";
import { panelShellClassName } from "./profile-ui";

export function NextOfKinSection({ tenant }: { tenant: TenantProfileRecord }) {
  return (
    <section className={panelShellClassName}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Emergency contact
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Next of kin
          </h2>
        </div>
        <Link
          href="/dashboard/tenant/profile/edit"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground transition hover:bg-muted/30"
        >
          <PencilLine className="h-3.5 w-3.5" />
          Edit
        </Link>
      </div>

      {!tenant.nextOfKin ? (
        <div className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
          No next of kin information has been added yet.
        </div>
      ) : (
        <div className="divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
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