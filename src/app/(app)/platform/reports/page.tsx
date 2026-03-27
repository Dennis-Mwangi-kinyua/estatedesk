import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

export default async function PlatformReportsPage() {
  const [
    organizations,
    activeSubscriptions,
    totalPayments,
    openIssues,
    queuedNotifications,
  ] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.payment.findMany({
      select: { amount: true },
      take: 500,
      orderBy: { createdAt: "desc" },
    }),
    prisma.issueTicket.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    prisma.notification.count({
      where: {
        status: "QUEUED",
      },
    }),
  ]);

  const paymentVolume = totalPayments.reduce(
    (sum: number, payment) => sum + toNumber(payment.amount),
    0
  );

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Platform Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          High-level operational and billing indicators across the platform.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card title="Organizations" value={organizations} />
        <Card title="Active Subscriptions" value={activeSubscriptions} />
        <Card title="Open Issues" value={openIssues} />
        <Card title="Queued Notifications" value={queuedNotifications} />
        <Card title="Recent Payment Volume" value={`KES ${paymentVolume.toLocaleString()}`} />
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}