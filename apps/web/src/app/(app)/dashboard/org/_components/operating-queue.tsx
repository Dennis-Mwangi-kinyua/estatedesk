import Link from "@/components/navigation/workspace-link";
import type { OperatingGroup } from "@/lib/workflow/operating-queue";
import { QueueRowAction } from "./queue-row-action";

function waitingAge(since: Date, now = new Date()) {
  const minutes = Math.max(0, Math.floor((now.getTime() - since.getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.floor(minutes / 60)} hr` : `${Math.floor(minutes / 1440)} days`;
}

export function OperatingQueue({ groups, compact = false, returnPath }: { groups: OperatingGroup[]; compact?: boolean; returnPath?: string }) {
  const waiting = groups.reduce((sum, group) => sum + group.total, 0);
  return (
    <section className="space-y-4" aria-labelledby="operating-queue-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="operating-queue-title" className="text-lg font-semibold">What is blocking money or a tenant</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{waiting ? `${waiting} items are waiting. The oldest row in each group is first.` : "Nothing is waiting. Issued bills are clear."}</p>
        </div>
        {compact ? <Link href="/dashboard/org/operating-queue" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Open the full queue</Link> : null}
      </div>
      <div className="space-y-4">
        {groups.map((group) => (
          <article key={group.id} id={group.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{group.title} <span className="text-muted-foreground">{group.total}</span></h3>
                <p className="mt-1 text-sm text-muted-foreground">{group.owner}. {group.nextAction}</p>
              </div>
              <Link href={group.href} className="inline-flex min-h-11 items-center text-sm font-semibold underline">Open list</Link>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {(compact ? group.items.slice(0, 3) : group.items).map((item) => (
                <li key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{item.who}</p>
                    <p className="text-sm text-muted-foreground">{item.where}{item.amount ? ` · ${item.amount}` : ""} · {item.status.replaceAll("_", " ")} · {waitingAge(item.since)}</p>
                  </div>
                  <QueueRowAction item={item} returnPath={returnPath} />
                </li>
              ))}
            </ul>
            {!group.items.length ? <p className="mt-3 text-sm text-muted-foreground">Nothing waiting.</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
