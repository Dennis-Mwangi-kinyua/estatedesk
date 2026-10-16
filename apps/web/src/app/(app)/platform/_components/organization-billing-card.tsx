import Link from "@/components/navigation/workspace-link";
import { ArrowUpRight, CreditCard } from "lucide-react";
import { Badge, toneForStatus } from "./control-plane";

export type OrganizationBillingSummary = {
  organizationId: string; organizationName: string; plan: string; status: string;
  billingEmail: string | null; periodEnd: Date;
};
export function OrganizationBillingCard({ subscription }: {subscription: OrganizationBillingSummary}) {
  const renewal = new Intl.DateTimeFormat("en-KE",{day:"numeric",month:"short",year:"numeric",timeZone:"Africa/Nairobi"}).format(subscription.periodEnd);
  return <Link href={`/platform/billing/${encodeURIComponent(subscription.organizationId)}`} className="group flex h-full min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
    <div className="flex flex-wrap items-center justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/50 text-primary"><CreditCard className="size-5" aria-hidden="true" /></span><Badge tone={toneForStatus(subscription.status)}>{subscription.status.replaceAll("_"," ")}</Badge></div>
    <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">Organization billing</p><h3 className="mt-1 break-words text-lg font-semibold">{subscription.organizationName}</h3></div>
    <dl className="space-y-3 border-y border-border py-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Subscription plan</dt><dd className="font-semibold">{subscription.plan}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">Period ends</dt><dd className="font-medium">{renewal}</dd></div><div><dt className="text-muted-foreground">Billing email</dt><dd className="mt-1 break-all font-medium">{subscription.billingEmail ?? "Not provided"}</dd></div></dl>
    <span className="mt-auto flex items-center justify-between gap-3 text-sm font-semibold text-primary">Open organization billing<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /></span>
  </Link>;
}
