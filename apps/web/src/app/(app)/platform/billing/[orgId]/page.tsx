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
      <Surface title="Recent plan history" description="The latest 20 recorded plan changes for this subscription.">{subscription.planChanges.length ? <ul className="divide-y divide-border">{subscription.planChanges.map(change=><li key={change.id} className="space-y-2 p-5 text-sm"><p className="font-semibold">{change.fromPlan ?? "Initial plan"} → {change.toPlan}</p><p className="text-muted-foreground">Effective {formatDateTime(change.effectiveFrom)}</p>{change.reason ? <p className="break-words">{change.reason}</p> : null}</li>)}</ul> : <p className="p-5 text-sm text-muted-foreground">No plan changes have been recorded.</p>}</Surface>
    </> : <Surface title="No subscription linked"><p className="p-5 text-sm text-muted-foreground">This organization does not have a subscription. Review its profile and subscription setup.</p><Link href={`/platform/organizations/${org.slug}`} className="m-5 mt-0 inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold">Open organization profile</Link></Surface>}
  </div>;
}
