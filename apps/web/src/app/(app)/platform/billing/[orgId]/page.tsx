import { randomUUID } from "node:crypto";
import { SUBSCRIPTION_INVOICE_ENTITY, invoiceData, invoiceBalance } from "@/lib/billing/invoice-ledger";
import { PaymentForm } from "./payment-form";
import Link from "@/components/navigation/workspace-link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { APP_PLANS } from "@/lib/billing/plans";
import { subscriptionDisplayAmount } from "@/lib/billing/subscription-summary";
import { parseUpgradeRequest } from "@/lib/billing/upgrade-request-policy";
import { Badge, PageHeader, Surface, formatCurrency, formatDateTime, toneForStatus } from "../../_components/control-plane";
import { OrgBillingActions } from "../../organizations/[slug]/_components/org-billing-actions";
export const dynamic = "force-dynamic";

export default async function OrganizationBillingPage({params}:{params:Promise<{orgId:string}>}) {
  await requirePlatformRole(["SUPER_ADMIN","PLATFORM_ADMIN"]);
  const {orgId} = await params;
  const org = await prisma.organization.findFirst({where:{OR:[{id:orgId},{slug:orgId}],deletedAt:null},include:{subscription:{include:{planChanges:{orderBy:{effectiveFrom:"desc"},take:20}}}}});
  if (!org) notFound();
  const invoices = await prisma.documentRecord.findMany({where:{orgId:org.id,entityType:SUBSCRIPTION_INVOICE_ENTITY},orderBy:{createdAt:"desc"},take:100});
  const ledger = invoices.map(record=>({record,data:invoiceData(record.metadata)}));
  const outstanding = await prisma.documentRecord.findMany({where:{orgId:org.id,entityType:SUBSCRIPTION_INVOICE_ENTITY,status:"ISSUED"},select:{metadata:true}});
  const totalOutstanding = outstanding.reduce((sum,record)=>sum + invoiceBalance(invoiceData(record.metadata)),0);
  const subscription = org.subscription;
  const amount = subscription ? subscriptionDisplayAmount(subscription.plan,subscription.metadata) : null;
  const upgrade = subscription ? parseUpgradeRequest(subscription.metadata) : null;
  return <div className="engineering-workspace mx-auto w-full min-w-0 max-w-6xl space-y-6">
    <PageHeader eyebrow="Platform / Organization billing" title={org.name} description="Manage this organization’s subscription, renewal dates, invoices, and billing history." action={<Link href="/platform/billing" className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold">All organization billing</Link>} />
    {subscription ? <>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Surface title="Subscription overview" description="The current plan and billing contact for this organization."><div className="space-y-5 p-5"><div className="flex flex-wrap gap-2"><Badge>{APP_PLANS[subscription.plan].name}</Badge><Badge tone={toneForStatus(subscription.status)}>{subscription.status.replaceAll("_"," ")}</Badge></div><dl className="grid gap-4 text-sm sm:grid-cols-2">{[["Monthly subscription",amount === null ? "Confirm custom pricing" : amount === 0 ? "Free" : formatCurrency(amount)],["Billing email",subscription.billingEmail ?? org.email ?? "Not provided"],["Period starts",formatDateTime(subscription.currentPeriodStart)],["Period ends",formatDateTime(subscription.currentPeriodEnd)],["Trial ends",formatDateTime(subscription.trialEndsAt)],["Cancelled at",formatDateTime(subscription.cancelledAt)]].map(([label,value])=><div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl><Link href={`/platform/organizations/${org.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">Open organization profile →</Link></div></Surface>
        <Surface title="Billing actions" description="Confirm payment before renewing. Invoice generation and subscription cancellation use their existing confirmation steps."><div className="p-5"><OrgBillingActions orgId={org.id} cancelled={subscription.status === "CANCELLED"} /></div></Surface>
      </div>
      {upgrade?.status === "PENDING" ? <Surface title="Pending upgrade request" description="Review the payment evidence before applying a paid plan."><div className="space-y-3 p-5 text-sm"><p>Requested plan: <strong>{upgrade.plan}</strong></p><p>Requested {formatDateTime(upgrade.requestedAt ? new Date(upgrade.requestedAt) : null)}</p><Link href="/platform/billing?upgrades=open#upgrade-requests" className="inline-flex min-h-11 items-center rounded-xl border px-4 font-semibold">Review upgrade requests</Link></div></Surface> : null}
      <Surface title="Invoices and payment history" description={`Outstanding balance across all issued invoices: ${formatCurrency(totalOutstanding / 100)}. Showing the latest 100 invoices. Historical payments made before this ledger was introduced must be reconciled separately.`}>
        {ledger.length ? <ul className="divide-y divide-border">{ledger.map(({record,data})=>{const balance=invoiceBalance(data);return <li key={record.id} className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="break-all font-semibold">{record.serialNumber}</p><p className="text-sm text-muted-foreground">Issued {formatDateTime(new Date(data.issuedAt))} · {data.plan}</p></div><a href={`/api/platform/subscription-invoices/${record.id}`} className="inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold">Download invoice</a></div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">{[["Invoice total",data.amountMinor],["Paid",data.amountMinor-balance],["Outstanding",balance]].map(([label,value])=><div key={String(label)}><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{formatCurrency(Number(value)/100)}</dd></div>)}</dl>
          {data.payments.length ? <ul className="space-y-2 text-sm" aria-label="Recorded payments">{data.payments.map(payment=><li key={payment.id} className="break-words rounded-lg bg-muted p-3">{formatCurrency(payment.amountMinor/100)} · Reference: {payment.reference} · Paid {formatDateTime(new Date(payment.paidAt))} · Recorded {formatDateTime(new Date(payment.recordedAt))}</li>)}</ul> : <p className="text-sm text-muted-foreground">No payments recorded against this invoice.</p>}
          {balance > 0 ? <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Record a received payment</summary><PaymentForm orgId={org.id} invoiceId={record.id} paymentId={randomUUID()} balance={balance/100}/></details> : <Badge>Paid in full</Badge>}
        </li>})}</ul> : <p className="p-5 text-sm text-muted-foreground">No saved invoices yet. Generate an invoice using Billing actions to start the ledger.</p>}
      </Surface>
      <Surface title="Recent plan history" description="The latest 20 recorded plan changes for this subscription.">{subscription.planChanges.length ? <ul className="divide-y divide-border">{subscription.planChanges.map(change=><li key={change.id} className="space-y-2 p-5 text-sm"><p className="font-semibold">{change.fromPlan ?? "Initial plan"} → {change.toPlan}</p><p className="text-muted-foreground">Effective {formatDateTime(change.effectiveFrom)}</p>{change.reason ? <p className="break-words">{change.reason}</p> : null}</li>)}</ul> : <p className="p-5 text-sm text-muted-foreground">No plan changes have been recorded.</p>}</Surface>
    </> : <Surface title="No subscription linked"><p className="p-5 text-sm text-muted-foreground">This organization does not have a subscription. Review its profile and subscription setup.</p><Link href={`/platform/organizations/${org.slug}`} className="m-5 mt-0 inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold">Open organization profile</Link></Surface>}
  </div>;
}
