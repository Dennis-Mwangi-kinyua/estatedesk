import Link from "@/components/navigation/workspace-link";
import { notFound } from "next/navigation";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/ledger-utils";
import { isBillingPeriod, nairobiDayStart } from "@/lib/billing/period-dates";
import { getPeriodBillForTenant } from "@/lib/billing/period-bill";
import { isMpesaStkConfigured } from "@/lib/mpesa/config";
import { approveMeterReading } from "@/app/(app)/dashboard/org/notifications/actions";
import { addPeriodPenaltyAction, issueLeasePeriodAction, recordBillReadingAction, sendBillStkAction, sendPeriodBillReminderAction, verifyBillPaymentAction } from "../actions";

export const dynamic = "force-dynamic";

function paymentProof(payment: { reference: string | null; externalReference: string | null; callbackRaw: unknown }) {
  const raw = payment.callbackRaw && typeof payment.callbackRaw === "object" && !Array.isArray(payment.callbackRaw)
    ? payment.callbackRaw as Record<string, unknown>
    : null;
  const note = raw && typeof raw.transactionMessage === "string" ? raw.transactionMessage.trim() : "";
  return {
    reference: payment.externalReference || payment.reference || "No reference",
    note,
    slip: Boolean(raw && typeof raw.proofAssetId === "string" && raw.proofAssetId),
  };
}

const notices: Record<string, string> = {
  "lease-issued": "Charges for this month are on the bill.",
  "penalty-added": "The penalty is on this bill.",
  "penalty-exists": "This month already has a penalty. One penalty is kept for the period.",
  "penalty-invalid": "Enter a penalty amount and a short reason.",
  "reminder-sent": "The balance was sent to the tenant.",
  "reminder-already": "This tenant already received today's reminder.",
  "nothing-due": "This bill has no balance to send.",
  "payment-verified": "The proof is verified and the receipt is on this bill.",
  "stk-sent": "The M-Pesa prompt was sent to the tenant's phone.",
  "stk-waiting": "An M-Pesa prompt for this month is already waiting.",
  "stk-phone": "Enter a valid Kenyan M-Pesa phone number.",
  "stk-unconfigured": "M-Pesa prompt is not set up for this organisation.",
  "stk-failed": "M-Pesa did not send the prompt. Check the number and try again.",
  "reading-saved": "The reading is saved. Approve it to put water on this bill.",
  "reading-invalid": "Enter whole-number readings, with the current reading at or above the previous one.",
  "reading-exists": "This month already has a reading.",
};

export default async function PeriodBillPage({ params, searchParams }: { params: Promise<{ leaseId: string }>; searchParams: Promise<{ period?: string; notice?: string; receipt?: string }> }) {
  const session = await requireManagementAccess();
  if (!session.activeOrgId) throw new Error("Missing active organization id in session");
  const { leaseId } = await params;
  const query = await searchParams;
  const period = query.period && isBillingPeriod(query.period) ? query.period : getCurrentPeriod();
  const orgId = session.activeOrgId;
  const lease = await prisma.lease.findFirst({
    where: { id: leaseId, orgId, deletedAt: null },
    select: {
      id: true,
      tenantId: true,
      unitId: true,
      status: true,
      tenant: { select: { fullName: true, phone: true } },
      unit: { select: { houseNo: true, property: { select: { name: true, waterRatePerUnit: true } } } },
    },
  });
  if (!lease) notFound();

  const [organization, bill, reading, priorReading, penalty, payments, remindedToday] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { currencyCode: true } }),
    getPeriodBillForTenant({ db: prisma, orgId, tenantId: lease.tenantId, period, showPendingWater: true }),
    prisma.meterReading.findUnique({ where: { unitId_period: { unitId: lease.unitId, period } }, select: { id: true, status: true, unitsUsed: true, currentReading: true, prevReading: true } }),
    prisma.meterReading.findFirst({ where: { unitId: lease.unitId, period: { not: period } }, orderBy: { period: "desc" }, select: { currentReading: true } }),
    prisma.rentCharge.findUnique({ where: { leaseId_period_chargeType: { leaseId, period, chargeType: "PENALTY" } }, select: { id: true, balance: true, description: true } }),
    prisma.payment.findMany({
      where: {
        orgId,
        reversedAt: null,
        OR: [
          { rentCharge: { leaseId, period } },
          { waterBill: { unitId: lease.unitId, period } },
          { payerTenantId: lease.tenantId, coveredPeriods: { has: period } },
          { payerTenantId: lease.tenantId, callbackRaw: { path: ["period"], equals: period } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, amount: true, method: true, reference: true, externalReference: true, gatewayStatus: true, verificationStatus: true, callbackRaw: true, receipt: { select: { id: true, receiptNo: true } } },
    }),
    prisma.notification.findFirst({
      where: {
        orgId,
        tenantId: lease.tenantId,
        type: { in: ["RENT_DUE_REMINDER", "RENT_OVERDUE_REMINDER"] },
        createdAt: { gte: nairobiDayStart() },
        message: { contains: period },
      },
      select: { id: true },
    }),
  ]);
  const canEnterReading = !reading && (lease.unit.property.waterRatePerUnit != null || priorReading != null);
  const stkConfigured = isMpesaStkConfigured(orgId);
  const receiptId = query.receipt && /^[a-z0-9]+$/i.test(query.receipt) ? query.receipt : null;
  const currency = organization?.currencyCode ?? "KES";
  const format = (value: number) => {
    try { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
    catch { return `${currency} ${Math.round(value).toLocaleString("en-KE")}`; }
  };
  const message = query.notice ? notices[query.notice] : null;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 p-4 pb-12 sm:p-6">
      <header>
        <Link href={`/dashboard/org/charges/bills?period=${period}`} className="inline-flex min-h-11 items-center text-sm font-semibold underline">All bills for {period}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{lease.tenant.fullName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{lease.unit.property.name} · Unit {lease.unit.houseNo} · {period} · {lease.status}</p>
      </header>
      {message ? <p role="status" className="rounded-xl border border-border bg-card px-4 py-3 text-sm">{message}{receiptId ? <> <Link href={`/api/receipts/${receiptId}`} className="font-semibold text-primary">Open receipt</Link></> : null}</p> : null}
      <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="bill-lines-title">
        <h2 id="bill-lines-title" className="font-semibold">Bill</h2>
        {bill ? (
          <>
            <p className="mt-2 text-2xl font-semibold">{format(bill.balance)} <span className="text-sm font-normal text-muted-foreground">of {format(bill.amountDue)} still due</span></p>
            <ul className="mt-3 divide-y divide-border text-sm">
              {bill.lines.map((line) => <li key={line.id} className="flex justify-between gap-3 py-2"><span>{line.label}</span><span>{format(line.balance)}</span></li>)}
            </ul>
          </>
        ) : <p className="mt-2 text-sm text-muted-foreground">No charges exist for this month yet.</p>}
        {lease.status === "ACTIVE" ? <form action={issueLeasePeriodAction} className="mt-4"><input type="hidden" name="leaseId" value={lease.id} /><input type="hidden" name="period" value={period} /><button className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold" type="submit">Issue this month&apos;s charges</button></form> : null}
      </section>
      <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="reading-title">
        <h2 id="reading-title" className="font-semibold">Water reading</h2>
        {reading?.status === "SUBMITTED" ? (
          <form action={approveMeterReading} className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">Reading {reading.currentReading} · {reading.unitsUsed} units used. Approving puts the water charge on this bill.</p>
            <input type="hidden" name="readingId" value={reading.id} />
            <button className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">Approve reading</button>
          </form>
        ) : canEnterReading ? (
          <form action={recordBillReadingAction} className="mt-3 grid gap-3">
            <p className="text-sm text-muted-foreground">Enter this month&apos;s meter reading. It stays submitted until you approve it onto the bill.</p>
            <input type="hidden" name="leaseId" value={lease.id} /><input type="hidden" name="period" value={period} />
            <label className="text-sm font-medium">Previous reading<input name="prevReading" inputMode="numeric" required defaultValue={priorReading?.currentReading ?? 0} className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" /></label>
            <label className="text-sm font-medium">Current reading<input name="currentReading" inputMode="numeric" required className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" /></label>
            <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold" type="submit">Save reading</button>
          </form>
        ) : <p className="mt-2 text-sm text-muted-foreground">{reading ? `Reading is ${reading.status.toLowerCase()}.` : "No reading has been submitted for this month."}</p>}
      </section>
      <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="penalty-title">
        <h2 id="penalty-title" className="font-semibold">Penalty</h2>
        {penalty ? <p className="mt-2 text-sm">This month already includes a penalty of {format(Number(penalty.balance))} outstanding. {penalty.description}</p> : (
          <form action={addPeriodPenaltyAction} className="mt-3 grid gap-3">
            <input type="hidden" name="leaseId" value={lease.id} /><input type="hidden" name="period" value={period} />
            <label className="text-sm font-medium">Amount<input name="amount" type="number" min="1" step="1" required className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" /></label>
            <label className="text-sm font-medium">Reason<input name="description" required minLength={3} maxLength={240} className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" placeholder="Late payment" /></label>
            <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold" type="submit">Add penalty to this bill</button>
          </form>
        )}
      </section>
      <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="collect-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="collect-title" className="font-semibold">Collection</h2>
          <form action={sendPeriodBillReminderAction}><input type="hidden" name="leaseId" value={lease.id} /><input type="hidden" name="period" value={period} /><button className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">Send the balance</button></form>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{remindedToday ? "A reminder already went out today." : "No reminder has gone out today."}</p>
        {bill && bill.balance > 0 && stkConfigured ? (
          <form action={sendBillStkAction} className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <input type="hidden" name="leaseId" value={lease.id} /><input type="hidden" name="period" value={period} />
            <label className="text-sm font-medium">M-Pesa phone<input name="phone" required defaultValue={lease.tenant.phone ?? ""} className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" placeholder="2547XXXXXXXX" /></label>
            <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold" type="submit">Send M-Pesa prompt</button>
          </form>
        ) : bill && bill.balance > 0 ? <p className="mt-3 text-sm text-muted-foreground">M-Pesa prompt is not set up for this organisation. The tenant can attach a proof on their invoice.</p> : null}
        <ul className="mt-3 space-y-4">
          {payments.map((payment) => {
            const proof = paymentProof(payment);
            return (
            <li key={payment.id} className="rounded-xl border border-border p-3 text-sm">
              <p className="font-medium">{payment.method.replaceAll("_", " ")} · {format(Number(payment.amount))}</p>
              <p className="mt-1 break-all text-muted-foreground">{proof.reference} · Gateway {payment.gatewayStatus.toLowerCase()} · Review {payment.verificationStatus.toLowerCase().replaceAll("_", " ")}</p>
              {proof.note ? <p className="mt-2 whitespace-pre-wrap break-words">{proof.note}</p> : null}
              {proof.slip ? <a href={`/api/payments/${payment.id}/proof`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary">Open slip</a> : null}
              {payment.verificationStatus === "PENDING" && !proof.note && !proof.slip ? <p className="mt-2 text-muted-foreground">No note or slip was attached. Match the reference against the statement.</p> : null}
              {payment.receipt ? <Link href={`/api/receipts/${payment.receipt.id}`} className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary">Receipt {payment.receipt.receiptNo}</Link> : null}
              {payment.verificationStatus === "PENDING" ? (
                <form action={verifyBillPaymentAction} className="mt-3 grid gap-2">
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <input type="hidden" name="leaseId" value={lease.id} />
                  <input type="hidden" name="period" value={period} />
                  <label className="font-medium">How the proof was checked<textarea name="verificationNote" required minLength={5} maxLength={2000} className="mt-1 block min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2" placeholder="Matched the M-Pesa code to this tenant and month" /></label>
                  <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 font-semibold" type="submit">Verify and issue receipt</button>
                </form>
              ) : null}
            </li>
            );
          })}
        </ul>
        {!payments.length ? <p className="mt-3 text-sm text-muted-foreground">No M-Pesa prompt or manual proof is attached to this month yet.</p> : null}
      </section>
    </main>
  );
}
