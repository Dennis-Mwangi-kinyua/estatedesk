import { BackfillChargesButton } from "./backfill-charges-button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { nairobiDate } from "@/lib/move-outs/validation";
import { ConfirmChargePaymentForm } from "./confirm-charge-payment-form";
import { ReceiptText, WalletCards } from "lucide-react";

export async function InitialChargesPanel({ orgId, tenantId, canConfirm = false }: { orgId: string; tenantId: string; canConfirm?: boolean }) {
  const leases = await prisma.lease.findMany({ where: { orgId, tenantId, deletedAt: null, status: { in: ["ACTIVE", "TERMINATED"] } }, orderBy: { startDate: "desc" }, select: { id: true, startDate: true, monthlyRent: true, deposit: true, org: { select: { currencyCode: true } } } });
  if (!leases.length) return null;
  const lease = leases[0];
  const charges = await prisma.rentCharge.findMany({
    where: { orgId, OR: leases.map(item => ({ leaseId: item.id, period: nairobiDate(item.startDate).slice(0, 7) })), chargeType: { in: ["RENT", "DEPOSIT"] } },
    orderBy: [{ chargeType: "asc" }, { id: "asc" }],
    include: { paymentAllocations: { where: { payment: { verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] }, gatewayStatus: "SUCCESS", reversedAt: null } }, include: { payment: { select: { receipt: { select: { id: true, receiptNo: true } } } } } } },
  });
  const missing = leases.some(item => (["RENT", "DEPOSIT"] as const).some(type =>
    (type === "RENT" ? item.monthlyRent : item.deposit)?.gt(0) &&
    !charges.some(charge => charge.leaseId === item.id && charge.chargeType === type)));
  if (!charges.length && !canConfirm) return null;
  const money = (value: unknown) => new Intl.NumberFormat("en-KE", { style: "currency", currency: lease.org.currencyCode }).format(Number(value));
  return <section className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-label="First rent and deposit">
    <div className="flex items-start gap-3"><WalletCards className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><h2 className="text-lg font-semibold">First rent and deposit</h2><p className="text-sm text-muted-foreground">Initial charges across your tenancies</p></div></div>
    {canConfirm && missing ? <BackfillChargesButton tenantId={tenantId} /> : null}
    <div className="grid gap-4 md:grid-cols-2">{charges.map(charge => <article key={charge.id} className="min-w-0 space-y-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{charge.chargeType === "DEPOSIT" ? "Security deposit" : "First month rent"}</h3><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{charge.status === "WAIVED" ? "Waived" : charge.balance.lte(0) ? "Paid" : charge.amountPaid.gt(0) ? "Partially paid" : "Unpaid"}</span></div>
      <p className="text-xs text-muted-foreground">Tenancy started {nairobiDate(leases.find(item => item.id === charge.leaseId)!.startDate)}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Amount due</dt><dd className="break-words font-semibold">{money(charge.amountDue)}</dd></div><div><dt className="text-muted-foreground">Paid</dt><dd className="break-words font-semibold">{money(charge.amountPaid)}</dd></div><div><dt className="text-muted-foreground">Balance</dt><dd className="break-words font-semibold">{money(charge.balance)}</dd></div><div><dt className="text-muted-foreground">Due date</dt><dd>{nairobiDate(charge.dueDate)}</dd></div></dl>
      {canConfirm && charge.status !== "WAIVED" && charge.balance.gt(0) ? <ConfirmChargePaymentForm chargeId={charge.id} amount={charge.balance.toFixed(2)} dateLimit={nairobiDate()} /> : null}
      <div className="flex flex-col gap-2">{Array.from(new Map(charge.paymentAllocations.flatMap(allocation => allocation.payment.receipt ? [[allocation.payment.receipt.id, allocation.payment.receipt] as const] : [])).values()).map(receipt => <Link key={receipt.id} href={`/api/receipts/${receipt.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 break-words text-sm font-semibold text-primary"><ReceiptText className="h-4 w-4 shrink-0" />Receipt {receipt.receiptNo}</Link>)}</div>
    </article>)}</div>
    <p className="text-sm font-semibold">Total remaining: {money(charges.reduce((sum, charge) => sum + (charge.status === "WAIVED" ? 0 : Number(charge.balance)), 0))}</p>
  </section>;
}
