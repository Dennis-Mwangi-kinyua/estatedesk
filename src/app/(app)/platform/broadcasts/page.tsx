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

export default async function BroadcastsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [orgs, admins, notifications, messages, onboardingRequests] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { deletedAt: null, platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] } },
    }),
    prisma.notification.findMany({
      where: { type: "GENERAL" },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        org: { select: { id: true, name: true, slug: true } },
        user: { select: { fullName: true } },
        tenant: { select: { fullName: true } },
      },
    }),
    prisma.platformMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        org: { select: { id: true, name: true, slug: true } },
        sender: { select: { fullName: true } },
      },
    }),
    prisma.onboardingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broadcasts"
        title="Platform communications"
        description="Operator view for broad announcements, support messages from organizations, and general notifications already sent or queued."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reachable orgs" value={orgs} />
        <StatCard label="Platform admins" value={admins} />
        <StatCard label="General notifications" value={notifications.length} />
        <StatCard label="New onboarding" value={onboardingRequests.filter((item) => item.status === "NEW").length} />
      </section>

      <Surface title="Recent general notifications">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((item) => (
                <tr key={item.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${item.org.id}`}>{item.org.name}</AdminLink>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {item.user?.fullName ?? item.tenant?.fullName ?? "Organization"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{item.channel}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{item.title}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {notifications.length === 0 ? (
                <EmptyRow colSpan={6} label="No general notifications found." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface title="Latest onboarding requests">
        <div className="divide-y divide-neutral-100">
          {onboardingRequests.map((request) => (
            <div key={request.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <AdminLink href="/platform/onboarding">{request.companyName}</AdminLink>
                <Badge tone={toneForStatus(request.status === "NEW" ? "pending" : request.status)}>{request.status}</Badge>
                <span className="text-xs text-neutral-500">{formatDateTime(request.createdAt)}</span>
              </div>
              <p className="mt-2 font-medium text-neutral-950">{request.fullName}</p>
              <p className="mt-1 text-sm text-neutral-500">
                {request.workEmail}
                {request.phone ? ` • ${request.phone}` : ""} • {request.managedPropertyType}
              </p>
            </div>
          ))}
          {onboardingRequests.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">No onboarding requests found.</div>
          ) : null}
        </div>
      </Surface>

      <Surface title="Latest organization messages">
        <div className="divide-y divide-neutral-100">
          {messages.map((message) => (
            <div key={message.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <AdminLink href={`/platform/organizations/${message.org.id}`}>{message.org.name}</AdminLink>
                <Badge tone={toneForStatus(message.status)}>{message.status}</Badge>
                <span className="text-xs text-neutral-500">{formatDateTime(message.createdAt)}</span>
              </div>
              <p className="mt-2 font-medium text-neutral-950">{message.subject}</p>
              <p className="mt-1 text-sm text-neutral-500">{message.message}</p>
            </div>
          ))}
          {messages.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">No organization messages found.</div>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
