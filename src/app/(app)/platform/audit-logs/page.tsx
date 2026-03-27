import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function PlatformAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          platformRole: true,
        },
      },
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Most recent platform and organization audit activity.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Recent Logs</h2>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Request</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-3">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{log.actor.fullName}</div>
                      <div className="text-xs text-muted-foreground">{log.actor.email ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3">{log.org.name}</td>
                    <td className="px-4 py-3">{log.action}</td>
                    <td className="px-4 py-3">
                      {log.entityType} · {log.entityId}
                    </td>
                    <td className="px-4 py-3">{log.requestId ?? "—"}</td>
                    <td className="px-4 py-3">{log.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}