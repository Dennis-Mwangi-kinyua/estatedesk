import type { ReactNode } from "react";
import Link from "next/link";
import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import { getOrgUnitHref } from "@/lib/units/url";
import { encodePublicId } from "@/lib/public-id";
import type { OrgRole } from "@prisma/client";
import type { LeaseDetailsData } from "../_lib/types";
import { LeaseDetailsGuidance } from "./lease-details-guidance";
import { LeaseDetailsHeader } from "./lease-details-header";
import { LeaseDetailsStats } from "./lease-details-stats";
import { LeaseNoticesPanel } from "./lease-notices-panel";
import { LeaseOverviewPanels } from "./lease-overview-panels";
import { LeaseRentChargesPanel } from "./lease-rent-charges-panel";
import { LeaseSecondaryPanels } from "./lease-secondary-panels";
import { LeaseTaxChargesPanel } from "./lease-tax-charges-panel";

export function LeaseDetailsWorkspace({
  data,
  orgRole,
  agreement,
}: {
  data: LeaseDetailsData;
  agreement?: ReactNode;
  orgRole?: OrgRole | null;
}) {
  const {
    lease,
    currencyCode,
    totalRentCharges,
    totalRentPaid,
    totalRentBalance,
    totalTaxCharges,
  } = data;

  return (
    <div className="org-theme-content uniform-page-actions lease-details-page mx-auto w-full min-w-0 max-w-7xl space-y-5 px-0 pb-24 pt-2 sm:px-2">
      <LeaseDetailsHeader lease={lease} />
      <LeaseDetailsStats lease={lease} currencyCode={currencyCode} />

      <nav aria-label="Lease quick actions" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Tenant profile", description: lease.tenant.fullName, href: `/dashboard/org/tenants/${encodeURIComponent(lease.tenant.slug ?? lease.tenant.id)}` },
          { label: "Unit and property", description: `${lease.unit.property.name} · Unit ${lease.unit.houseNo}`, href: getOrgUnitHref({ id: lease.unit.id, houseNo: lease.unit.houseNo, buildingName: lease.unit.building?.name, propertyName: lease.unit.property.name }) },
          { label: "Lease signing", description: "Review the agreement and signatures", href: `/dashboard/org/leases/${encodePublicId(lease.id, "lease")}/signing` },
        ].map((action) => <Link key={action.href} href={action.href} className="group flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"><VisualSticker label={action.label} className="shrink-0" /><span className="min-w-0 flex-1"><span className="block font-semibold">{action.label}<span aria-hidden="true" className="ml-2 text-primary">↗</span></span><span className="mt-1 block break-words text-sm text-muted-foreground">{action.description}</span></span></Link>)}
      </nav>
      <LeaseOverviewPanels lease={lease} />
      <LeaseSecondaryPanels lease={lease} currencyCode={currencyCode}
        totalRentCharges={totalRentCharges} totalRentPaid={totalRentPaid}
        totalRentBalance={totalRentBalance} totalTaxCharges={totalTaxCharges} />
      <section id="lease-agreement" className="scroll-mt-6 min-w-0">{agreement}</section>
      <LeaseRentChargesPanel lease={lease} currencyCode={currencyCode} />
      <LeaseTaxChargesPanel lease={lease} currencyCode={currencyCode} />
      <LeaseNoticesPanel lease={lease} />
      <LeaseDetailsGuidance orgRole={orgRole} tenantId={lease.tenant.id} />
    </div>
  );
}
