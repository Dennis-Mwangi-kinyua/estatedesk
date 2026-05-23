import { prisma } from "@/lib/prisma";
import { countOnlineUsers } from "@/lib/auth/presence";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  labelize,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

const SECURITY_ACTION_HINTS = [
  "LOGIN",
  "LOGOUT",
  "DENIED",
  "PASSWORD",
  "ADMIN",
  "PERMISSION",
  "SESSION",
  "SUSPEND",
  "DISABLE",
];

export default async function SecurityCenterPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [
    activeSessions,
    onlineUsers,
    platformAdmins,
    forcedChanges,
    resetTokens,
    logs,
  ] = await Promise.all([
    prisma.userSession.count({ where: { expiresAt: { gt: new Date() } } }),
    countOnlineUsers(),
    prisma.user.count({
      where: { deletedAt: null, platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] } },
    }),
    prisma.user.count({ where: { deletedAt: null, mustChangePassword: true } }),
    prisma.passwordResetToken.count({ where: { usedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.auditLog.findMany({
      where: {
        OR: SECURITY_ACTION_HINTS.map((hint) => ({
          action: { contains: hint, mode: "insensitive" },
        })),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: { select: { fullName: true, email: true, platformRole: true } },
        org: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security center"
        title="Access and risk signals"
        description="Active sessions, admin footprint, password reset exposure, and security-relevant audit events."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Online now" value={onlineUsers} />
        <StatCard label="Active sessions" value={activeSessions} />
        <StatCard label="Platform admins" value={platformAdmins} />
        <StatCard label="Must change password" value={forcedChanges} />
        <StatCard label="Reset tokens" value={resetTokens} />
      </section>

      <Surface title="Security audit stream">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-950">{log.actor.fullName}</p>
                    <p className="mt-1 text-xs text-neutral-500">{log.actor.email ?? log.actor.platformRole}</p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${log.org.slug}`}>{log.org.name}</AdminLink>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(log.action)}>{labelize(log.action)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{log.entityType} / {log.entityId}</td>
                  <td className="px-4 py-3 text-neutral-600">{log.ip ?? "-"}</td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <EmptyRow colSpan={6} label="No security audit events found." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
