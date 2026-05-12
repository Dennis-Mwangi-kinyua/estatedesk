import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

export default async function SubscriptionToolsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const subscriptions = await prisma.subscription.findMany({
    orderBy: [{ status: "asc" }, { currentPeriodEnd: "asc" }],
    include: {
      org: { select: { id: true, name: true, slug: true, status: true } },
      planChanges: { orderBy: { effectiveFrom: "desc" }, take: 1 },
    },
  });

  const now = new Date();
  const expiringSoon = subscriptions.filter((sub) => {
    const days = (sub.currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    return days >= 0 && days <= 14;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Subscription controls"
        title="Plan enforcement"
        description="Subscription operations view for renewals, trials, past-due plans, and plan-change history."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Subscriptions" value={subscriptions.length} />
        <StatCard label="Active" value={subscriptions.filter((s) => s.status === "ACTIVE").length} />
        <StatCard label="Past due" value={subscriptions.filter((s) => s.status === "PAST_DUE").length} />
        <StatCard label="Ending in 14 days" value={expiringSoon.length} />
      </section>

      <Surface title="Plan enforcement queue">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Period end</th>
                <th className="px-4 py-3 font-medium">Trial end</th>
                <th className="px-4 py-3 font-medium">Billing email</th>
                <th className="px-4 py-3 font-medium">Latest change</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${sub.org.slug}`}>{sub.org.name}</AdminLink>
                    <p className="mt-1 text-xs text-neutral-500">/{sub.org.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{sub.plan}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(sub.status)}>{sub.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(sub.currentPeriodEnd)}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(sub.trialEndsAt)}</td>
                  <td className="px-4 py-3 text-neutral-600">{sub.billingEmail ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {sub.planChanges[0]
                      ? `${sub.planChanges[0].fromPlan ?? "-"} -> ${sub.planChanges[0].toPlan}`
                      : "-"}
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 ? (
                <EmptyRow colSpan={7} label="No subscriptions found." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
