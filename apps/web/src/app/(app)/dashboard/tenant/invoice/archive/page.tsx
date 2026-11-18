import Link from "@/components/navigation/workspace-link";
import { PageShell, SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { isBillingPeriod, nairobiBillingPeriod } from "@/lib/billing/period-dates";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { tenantInvoiceDownloadPath, tenantInvoiceViewPath } from "../_lib/paths";

export default async function InvoiceArchivePage() {
  const session = await requireTenantAccess();
  const orgId = session.activeOrgId!;
  const tenant = await prisma.tenant.findFirst({
    where: { orgId, userId: session.userId, deletedAt: null },
    select: {
      leases: {
        where: { orgId, deletedAt: null, status: { in: ["EXPIRED", "TERMINATED"] } },
        orderBy: [{ startDate: "desc" }, { id: "desc" }],
        select: {
          id: true, unitId: true, startDate: true, endDate: true,
          unit: { select: { houseNo: true, property: { select: { name: true } } } },
          rentCharges: { where: { orgId, status: { not: "WAIVED" } }, distinct: ["period"], select: { period: true } },
        },
      },
      waterBills: {
        where: { orgId, status: { not: "CANCELLED" } },
        select: { unitId: true, period: true },
      },
    },
  });
  const archive = (tenant?.leases ?? []).map(lease => {
    const start = nairobiBillingPeriod(lease.startDate);
    const end = lease.endDate ? nairobiBillingPeriod(lease.endDate) : null;
    const water = (tenant?.waterBills ?? []).filter(bill =>
      bill.unitId === lease.unitId && end && bill.period >= start && bill.period <= end,
    );
    const periods = [...new Set([...lease.rentCharges, ...water].map(charge => charge.period))]
      .filter(isBillingPeriod).sort().reverse();
    return { lease, periods };
  }).filter(group => group.periods.length > 0);

  return (
    <PageShell>
      <div className="space-y-4">
        <header>
          <Link href="/dashboard/tenant/history" className="inline-flex min-h-11 items-center text-sm text-primary underline">Back to account history</Link>
          <h1 className="text-2xl font-bold">Invoice archive</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and download bills from your ended leases.</p>
        </header>
        {archive.length === 0 ? <SurfaceCard className="p-4">No archived invoices yet.</SurfaceCard> : null}
        {archive.map(({ lease, periods }) => (
          <SurfaceCard key={lease.id} className="p-4">
            <h2 className="font-semibold">{lease.unit.property.name} · Unit {lease.unit.houseNo}</h2>
            <p className="text-sm text-muted-foreground">{nairobiBillingPeriod(lease.startDate)} to {lease.endDate ? nairobiBillingPeriod(lease.endDate) : "lease end"}</p>
            <ul className="mt-3 divide-y divide-border">
              {periods.map(period => (
                <li key={period} className="flex flex-wrap items-center justify-between gap-x-4 py-1">
                  <span>{period}</span>
                  <div className="flex flex-wrap gap-x-4 text-sm text-primary">
                    <Link aria-label={`View invoice for ${period}`} href={tenantInvoiceViewPath(period, lease.id)} className="inline-flex min-h-11 items-center underline">View invoice</Link>
                    <a aria-label={`Download invoice for ${period}`} href={tenantInvoiceDownloadPath(period, { leaseId: lease.id })} className="inline-flex min-h-11 items-center underline">Download PDF</a>
                  </div>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        ))}
      </div>
    </PageShell>
  );
}
