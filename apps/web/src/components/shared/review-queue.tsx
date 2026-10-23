import Link from "@/components/navigation/workspace-link";
import { waitingAge, type ReviewGroup } from "@/lib/workflow/review-queue";

export function ReviewQueue({ groups, summaryOnly = false }: { groups: ReviewGroup[]; summaryOnly?: boolean }) {
  return <section aria-label="Pending reviews" className="space-y-5">
    <div><h2 className="text-xl font-semibold">Needs attention</h2><p className="mt-1 text-sm text-muted-foreground">Open a queue to see what needs a decision and who should handle it.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{groups.map(group => <Link key={group.id} href={group.href} className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition hover:border-primary focus-visible:outline-2 focus-visible:outline-primary">
      <h3 className="font-semibold">{group.title}</h3><p className="text-3xl font-semibold">{group.total}</p><p className="text-xs text-muted-foreground">Responsible: {group.owner}</p><p className="text-sm">{group.nextAction}</p><p className="mt-auto text-xs font-medium text-primary">{group.items[0] ? `Oldest waiting: ${waitingAge(group.items[0].since)} · Open queue →` : "Nothing waiting"}</p>
    </Link>)}</div>
    {!summaryOnly ? groups.map(group => <div key={group.id} id={group.id} className="space-y-3"><h3 className="font-semibold">{group.title} · {group.total}</h3><p className="text-xs text-muted-foreground">Oldest {group.items.length} shown · Responsible: {group.owner}</p><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{group.items.map(item => <article key={item.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5"><p className="break-words font-semibold">{item.title}</p><p className="break-words text-sm text-muted-foreground">{item.detail}</p><p className="text-xs">{item.status.replaceAll("_", " ")} · Waiting {waitingAge(item.since)}</p><p className="text-sm">Next: {group.nextAction}</p><Link href={item.href} className="mt-auto inline-flex min-h-11 items-center font-semibold text-primary">Review item →</Link></article>)}</div>{!group.items.length ? <p className="text-sm text-muted-foreground">No items waiting.</p> : null}</div>) : null}
  </section>;
}
