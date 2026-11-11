import Link from "@/components/navigation/workspace-link";
import { prisma } from "@/lib/prisma";

/** A failed query is unknown, never a misleading zero or healthy status. */
async function readOperationsCounts() {
  return Promise.allSettled([
    prisma.notification.count({ where: { status: "QUEUED" } }),
    prisma.notification.count({ where: { status: "FAILED" } }),
    prisma.cronJobRun.count({ where: { status: "FAILED", startedAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);
}

export async function PlatformOperationsSummary() {
  const results = await readOperationsCounts();
  const cards = [
    { title: "Queued notifications", href: "/platform/jobs/notifications", detail: "Inspect pending deliveries" },
    { title: "Failed notifications", href: "/platform/jobs/notifications", detail: "Review delivery failures and retries" },
    { title: "Failed scheduled runs · 24h", href: "/platform/jobs", detail: "Inspect recent runs and errors" },
  ];
  return <section aria-labelledby="platform-operations-title" className="rounded-2xl border border-border bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="platform-operations-title" className="text-lg font-semibold">System operations</h2><p className="mt-1 text-sm text-muted-foreground">Delivery queues and scheduled work alongside your business priorities.</p></div>
      <Link href="/platform/system-health" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">Open system health</Link>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">{cards.map((card, index) => {
      const result = results[index];
      return <Link key={card.title} href={card.href} className="min-w-0 rounded-xl border border-border bg-muted/30 p-4 transition hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary">
        <p className="text-sm font-medium">{card.title}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{result.status === "fulfilled" ? result.value.toLocaleString() : "Unavailable"}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{card.detail}</p>
      </Link>;
    })}</div>
  </section>;
}
