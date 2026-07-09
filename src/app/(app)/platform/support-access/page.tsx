import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { getActiveSupportSession } from "@/lib/platform/support-session";
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
import {
  enterOrgSupportAccessAction,
  leaveOrgSupportAccessAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function SupportAccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const params = await searchParams;
  const activeSupport = await getActiveSupportSession(session.userId);

  const [orgs, admins, supportLogs] = await Promise.all([
    prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      take: 200,
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
      where: {
        deletedAt: null,
        platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: "SUPPORT", mode: "insensitive" } },
          { action: { contains: "PLATFORM_SUPPORT", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        actor: { select: { fullName: true, email: true } },
        org: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Organization support console"
        description="Enter a live organization workspace as ADMIN with a timed support session, reason capture, and audit trail. Leave when finished."
      />

      {params.error === "support-reason" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Support entry requires a reason (at least 8 characters).
        </div>
      ) : null}
      {params.error === "org-inactive" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          That organization is not ACTIVE. Reactivate it before support entry.
        </div>
      ) : null}

      {activeSupport ? (
        <Surface
          title="Active support session"
          description="You currently have a timed support seat. Leave it to return to the platform shell."
        >
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">{activeSupport.orgName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                /{activeSupport.orgSlug} · {activeSupport.reason}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Expires {formatDateTime(new Date(activeSupport.expiresAtUnix * 1000))}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/dashboard/org"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Open workspace
              </a>
              <form action={leaveOrgSupportAccessAction}>
                <input type="hidden" name="returnTo" value="/platform/support-access" />
                <button className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold">
                  Leave support
                </button>
              </form>
            </div>
          </div>
        </Surface>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Supportable orgs" value={orgs.length} />
        <StatCard label="Platform operators" value={admins} />
        <StatCard label="Recent access logs" value={supportLogs.length} />
        <StatCard label="Session length" value="1–8 hours" />
      </section>

      <Surface
        title="Organization support targets"
        description="Provide a reason and duration, then enter the org workspace. All support activity is audit-logged."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
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
                <tr key={org.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${org.slug}`}>
                      {org.name}
                    </AdminLink>
                    <p className="mt-1 text-xs text-muted-foreground">/{org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(org.status)}>{org.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org._count.memberships}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org._count.tenants}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org._count.payments}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(org.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <form action={enterOrgSupportAccessAction} className="space-y-1.5">
                      <input type="hidden" name="orgId" value={org.id} />
                      <input
                        name="reason"
                        required
                        minLength={8}
                        placeholder="Support reason (required)"
                        className="h-9 w-full min-w-[12rem] rounded-lg border border-border bg-card px-2 text-xs"
                      />
                      <select
                        name="hours"
                        defaultValue="2"
                        className="h-9 w-full rounded-lg border border-border bg-card px-2 text-xs"
                      >
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="4">4 hours</option>
                        <option value="8">8 hours</option>
                      </select>
                      <button
                        type="submit"
                        disabled={org.status !== "ACTIVE"}
                        className="h-9 w-full rounded-lg bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        Enter as support
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 ? (
                <EmptyRow colSpan={7} label="No organizations found." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface title="Recent support audit trail">
        <div className="divide-y divide-border">
          {supportLogs.map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{log.action}</p>
                <p className="text-xs text-muted-foreground">
                  {log.actor.fullName}
                  {log.org ? ` · ${log.org.name}` : ""}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(log.createdAt)}
              </p>
            </div>
          ))}
          {supportLogs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No support access events yet.
            </div>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
