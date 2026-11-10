import Link from "@/components/navigation/workspace-link";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/ledger-utils";
import { isBillingPeriod } from "@/lib/billing/period-dates";
import { isPayableWaterBillStatus } from "@/lib/water-bills/status";
import { issuePeriodBillsAction, remindUnpaidBillsAction } from "./actions";

export const dynamic = "force-dynamic";

function noticeText(notice?: string) {
  if (!notice) return null;
  if (notice.startsWith("issued-")) return `Issued ${notice.slice("issued-".length)} new rent charges. Existing charges were left as they are.`;
  const reminded = /^reminded-(\d+)-already-(\d+)$/.exec(notice);
  if (reminded) {
    const sent = Number(reminded[1]);
    const already = Number(reminded[2]);
    if (sent === 0 && already === 0) return "No unpaid bills for this month.";
    const sentSentence = `Queued reminders for ${sent} unpaid ${sent === 1 ? "bill" : "bills"} in this month.`;
    if (already === 0) return sentSentence;
    return `${sentSentence} ${already} ${already === 1 ? "tenant already had" : "tenants already had"} today's reminder.`;
  }
  if (notice === "invalid-period") return "Use a month in YYYY-MM format.";
  return null;
}

export default async function PeriodBillsPage({ searchParams }: { searchParams: Promise<{ period?: string; notice?: string }> }) {
  const session = await requireManagementAccess();
  if (!session.activeOrgId) throw new Error("Missing active organization id in session");
  const params = await searchParams;
  const period = params.period && isBillingPeriod(params.period) ? params.period : getCurrentPeriod();
  const orgId = session.activeOrgId;
  const [organization, leases] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { currencyCode: true, name: true } }),
    prisma.lease.findMany({
      where: { orgId, deletedAt: null, status: "ACTIVE" },
      orderBy: [{ unit: { houseNo: "asc" } }, { id: "asc" }],
      select: {
        id: true,
        monthlyRent: true,
        tenant: { select: { fullName: true } },
        unit: { select: { houseNo: true, property: { select: { name: true } } } },
        rentCharges: { where: { period }, select: { balance: true, status: true, chargeType: true } },
        unitId: true,
      },
    }),
  ]);
  const unitIds = leases.map((lease) => lease.unitId);
  const waterBills = unitIds.length
    ? await prisma.waterBill.findMany({
      where: { orgId, period, unitId: { in: unitIds } },
      select: { unitId: true, balance: true, status: true, total: true },
    })
    : [];
  const waterByUnit = new Map(waterBills.map((bill) => [bill.unitId, bill]));
  const currency = organization?.currencyCode ?? "KES";
  const format = (value: number) => {
    try { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
    catch { return `${currency} ${Math.round(value).toLocaleString("en-KE")}`; }
  };
  const rows = leases.map((lease) => {
    const chargeBalance = lease.rentCharges.filter((charge) => charge.status !== "WAIVED").reduce((sum, charge) => sum + Number(charge.balance), 0);
    const water = waterByUnit.get(lease.unitId);
    const waterBalance = water && isPayableWaterBillStatus(water.status) ? Number(water.balance) : 0;
    return { ...lease, balance: chargeBalance + waterBalance, issued: lease.rentCharges.length > 0 || Boolean(water) };
  });
  const outstanding = rows.filter((row) => row.balance > 0).length;
  const message = noticeText(params.notice);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 pb-12 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{organization?.name}</p>
          <h1 className="text-2xl font-semibold">This month</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Issue rent and recurring charges for {period}, then open one bill to approve water, add a penalty, send the balance, or issue a receipt.</p>
        </div>
        <Link href="/dashboard/org" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Back to dashboard</Link>
      </header>
      {message ? <p role="status" className="rounded-xl border border-border bg-card px-4 py-3 text-sm">{message}</p> : null}
      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="text-sm font-medium">Month<input name="period" defaultValue={period} pattern="\d{4}-\d{2}" required className="mt-1 block h-11 rounded-xl border border-border bg-background px-3" /></label>
        <button className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold" type="submit">Show month</button>
      </form>
      <div className="flex flex-wrap gap-3">
        <form action={issuePeriodBillsAction}><input type="hidden" name="period" value={period} /><button className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">Issue bills for active leases</button></form>
        <form action={remindUnpaidBillsAction}><input type="hidden" name="period" value={period} /><button className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold" type="submit">Remind unpaid bills for this month</button></form>
      </div>
      <p className="text-sm text-muted-foreground">{rows.length} active leases · {outstanding} with a balance</p>
      {rows.length === 0 ? <section className="rounded-2xl border border-dashed border-border p-6 text-sm">Add a tenant and lease before this month can be issued. <Link className="font-semibold underline" href="/dashboard/org/tenants/new">Add a tenant</Link></section> : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {rows.map((lease) => (
            <li key={lease.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{lease.tenant.fullName}</p>
                <p className="text-sm text-muted-foreground">{lease.unit.property.name} · Unit {lease.unit.houseNo} · {lease.issued ? format(lease.balance) : "Not issued"}</p>
              </div>
              <Link href={`/dashboard/org/charges/bills/${lease.id}?period=${period}`} className="inline-flex min-h-11 items-center font-semibold text-primary">Open bill</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
