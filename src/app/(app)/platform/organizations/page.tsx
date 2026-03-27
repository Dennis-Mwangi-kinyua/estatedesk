import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export default async function PlatformBillingPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
      planChanges: {
        orderBy: { effectiveFrom: "desc" },
        take: 3,
      },
    },
  });

  const total = subscriptions.length;
  const active = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const trialing = subscriptions.filter((s) => s.status === "TRIALING").length;
  const pastDue = subscriptions.filter((s) => s.status === "PAST_DUE").length;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Subscription plans, renewal windows, and recent plan changes.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Subscriptions" value={total} />
        <Stat title="Active" value={active} />
        <Stat title="Trialing" value={trialing} />
        <Stat title="Past Due" value={pastDue} />
      </section>

      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Subscriptions</h2>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No subscriptions found.</div>
        ) : (
          <div className="divide-y">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/platform/organizations`}
                    className="text-lg font-semibold underline underline-offset-4"
                  >
                    {subscription.org.name}
                  </Link>
                  <Badge>{subscription.plan}</Badge>
                  <Badge>{subscription.status}</Badge>
                </div>

                <div className="grid gap-2 md:grid-cols-3 text-sm text-muted-foreground">
                  <p>Billing email: {subscription.billingEmail ?? "—"}</p>
                  <p>Period start: {formatDate(subscription.currentPeriodStart)}</p>
                  <p>Period end: {formatDate(subscription.currentPeriodEnd)}</p>
                  <p>Trial start: {formatDate(subscription.trialStartsAt)}</p>
                  <p>Trial end: {formatDate(subscription.trialEndsAt)}</p>
                  <p>Cancelled at: {formatDate(subscription.cancelledAt)}</p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Recent Plan Changes</p>
                  {subscription.planChanges.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No plan changes recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {subscription.planChanges.map((change) => (
                        <div key={change.id} className="rounded-lg border p-3 text-sm">
                          <span className="font-medium">
                            {change.fromPlan ?? "—"} → {change.toPlan}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            effective {formatDate(change.effectiveFrom)}
                          </span>
                          {change.reason && (
                            <p className="mt-1 text-muted-foreground">{change.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
      {children}
    </span>
  );
}