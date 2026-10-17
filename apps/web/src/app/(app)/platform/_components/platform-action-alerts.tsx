import Link from "@/components/navigation/workspace-link";
export function PlatformActionAlerts({counts}:{counts:{overdue:number;upgrades:number;countersignatures:number}}) {
  const items = [
    {label:"Overdue subscriptions",count:counts.overdue,href:"/platform/billing?status=overdue",detail:"Review expired paid subscriptions and outstanding billing."},
    {label:"Pending upgrades",count:counts.upgrades,href:"/platform/billing?upgrades=open#upgrade-requests",detail:"Check payment evidence before applying a new plan."},
    {label:"Awaiting countersignature",count:counts.countersignatures,href:"/platform/agreements?view=countersign",detail:"Organizations have signed; EstateDesk must countersign."},
  ];
  return <section aria-label="Platform action queues" className="grid gap-3 md:grid-cols-3">{items.map(item=><Link key={item.label} href={item.href} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-sm font-semibold">{item.label}</p><p className="my-2 text-3xl font-semibold tabular-nums">{item.count}</p><p className="text-sm text-muted-foreground">{item.detail}</p><span className="mt-3 inline-block text-sm font-semibold text-primary">Review queue →</span></Link>)}</section>;
}
