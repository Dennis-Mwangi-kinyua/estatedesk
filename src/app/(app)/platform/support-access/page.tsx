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

export default async function SupportAccessPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [orgs, admins, supportLogs] = await Promise.all([
    prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
        _count: { select: { memberships: true, tenants: true, payments: true } },
      },
    }),
    prisma.user.count({
      where: { deletedAt: null, platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] } },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: "IMPERSONATE", mode: "insensitive" } },
          { action: { contains: "SUPPORT", mode: "insensitive" } },
          { action: { contains: "ACCESS", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        actor: { select: { fullName: true, email: true } },
        org: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support access"
        title="Organization support console"
        description="A supervised entry point for support workflows. Access should require reason capture and audit logs before enabling live impersonation."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Supportable orgs" value={orgs.length} />
        <StatCard label="Platform operators" value={admins} />
        <StatCard label="Recent access logs" value={supportLogs.length} />
        <StatCard label="Guardrail" value="Audit required" />
      </section>

      <Surface title="Organization support targets">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Tenants</th>
                <th className="px-4 py-3 font-medium">Payments</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium">Support action</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${org.slug}`}>{org.name}</AdminLink>
                    <p className="mt-1 text-xs text-neutral-500">/{org.slug}</p>
                  </td>
                  <td className="px-4 py-3"><Badge tone={toneForStatus(org.status)}>{org.status}</Badge></td>
                  <td className="px-4 py-3 text-neutral-600">{org._count.memberships}</td>
                  <td className="px-4 py-3 text-neutral-600">{org._count.tenants}</td>
                  <td className="px-4 py-3 text-neutral-600">{org._count.payments}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(org.updatedAt)}</td>
                  <td className="px-4 py-3 text-neutral-600">Reason required before session handoff</td>
                </tr>
              ))}
              {orgs.length === 0 ? <EmptyRow colSpan={7} label="No organizations found." /> : null}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface title="Support access audit">
        <div className="divide-y divide-neutral-100">
          {supportLogs.map((log) => (
            <div key={log.id} className="p-4">
              <p className="font-medium text-neutral-950">{log.action}</p>
              <p className="mt-1 text-sm text-neutral-500">
                {log.actor.fullName} • {log.org.name} • {formatDateTime(log.createdAt)}
              </p>
            </div>
          ))}
          {supportLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">
              No support access audit events found.
            </div>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
