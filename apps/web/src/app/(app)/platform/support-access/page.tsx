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

type OrgTarget = {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: Date;
  _count: {
    memberships: number;
    tenants: number;
    payments: number;
  };
};

function SupportEnterForm({
  org,
  dense = false,
}: {
  org: OrgTarget;
  dense?: boolean;
}) {
  const disabled = org.status !== "ACTIVE";

  return (
    <form
      action={enterOrgSupportAccessAction}
      className={dense ? "space-y-1.5" : "space-y-2"}
    >
      <input type="hidden" name="orgId" value={org.id} />
      <label className="sr-only" htmlFor={`reason-${org.id}`}>
        Support reason for {org.name}
      </label>
      <input
        id={`reason-${org.id}`}
        name="reason"
        required
        minLength={8}
        placeholder="Support reason (required)"
        disabled={disabled}
        className="min-h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-foreground disabled:opacity-50"
      />
      <div className={dense ? "grid gap-1.5" : "grid gap-2 sm:grid-cols-[1fr_auto]"}>
        <label className="sr-only" htmlFor={`hours-${org.id}`}>
          Session duration
        </label>
        <select
          id={`hours-${org.id}`}
          name="hours"
          defaultValue="2"
          disabled={disabled}
          className="min-h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-foreground disabled:opacity-50"
        >
          <option value="1">1 hour</option>
          <option value="2">2 hours</option>
          <option value="4">4 hours</option>
          <option value="8">8 hours</option>
        </select>
        <button
          type="submit"
          disabled={disabled}
          className="min-h-10 w-full rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[8.5rem]"
        >
          Enter as support
        </button>
      </div>
      {disabled ? (
        <p className="text-[11px] font-medium text-amber-800 dark:text-amber-200">
          Org must be ACTIVE before support entry.
        </p>
      ) : null}
    </form>
  );
}

function OrgSupportCard({ org }: { org: OrgTarget }) {
  return (
    <article className="min-w-0 border-b border-border last:border-b-0">
      <div className="space-y-3 px-3 py-3.5 sm:px-4 sm:py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <AdminLink href={`/platform/organizations/${org.slug}`}>
              <span className="block truncate text-sm font-semibold">
                {org.name}
              </span>
            </AdminLink>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              /{org.slug}
            </p>
          </div>
          <Badge tone={toneForStatus(org.status)}>{org.status}</Badge>
        </div>

        <dl className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/30 p-2.5 text-center text-[11px] sm:text-xs">
          <div className="min-w-0">
            <dt className="font-medium text-muted-foreground">Members</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {org._count.memberships}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-muted-foreground">Tenants</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {org._count.tenants}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-muted-foreground">Payments</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {org._count.payments}
            </dd>
          </div>
        </dl>

        <p className="text-[11px] text-muted-foreground sm:text-xs">
          Last activity:{" "}
          <span className="font-medium text-foreground">
            {formatDateTime(org.updatedAt)}
          </span>
        </p>

        <SupportEnterForm org={org} />
      </div>
    </article>
  );
}

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
    <div className="ed-mobile-first space-y-4 sm:space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Organization support console"
        description="Enter a live organization workspace as ADMIN with a timed support session, reason capture, and audit trail. Leave when finished."
      />

      {params.error === "support-reason" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-5 text-amber-950 sm:px-4 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Support entry requires a reason (at least 8 characters).
        </div>
      ) : null}
      {params.error === "org-inactive" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-5 text-amber-950 sm:px-4 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          That organization is not ACTIVE. Reactivate it before support entry.
        </div>
      ) : null}

      {activeSupport ? (
        <Surface
          title="Active support session"
          description="You currently have a timed support seat. Leave it to return to the platform shell."
        >
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {activeSupport.orgName}
              </p>
              <p className="mt-1 break-words text-sm text-muted-foreground">
                /{activeSupport.orgSlug} · {activeSupport.reason}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Expires {formatDateTime(new Date(activeSupport.expiresAtUnix * 1000))}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <a
                href="/dashboard/org"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground sm:w-auto"
              >
                Open workspace
              </a>
              <form action={leaveOrgSupportAccessAction} className="w-full sm:w-auto">
                <input type="hidden" name="returnTo" value="/platform/support-access" />
                <button
                  type="submit"
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold sm:w-auto"
                >
                  Leave support
                </button>
              </form>
            </div>
          </div>
        </Surface>
      ) : null}

      <section className="ed-keep-cols grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Supportable orgs" value={orgs.length} />
        <StatCard label="Platform operators" value={admins} />
        <StatCard label="Recent access logs" value={supportLogs.length} />
        <StatCard label="Session length" value="1–8 hours" />
      </section>

      <Surface
        title="Organization support targets"
        description="Provide a reason and duration, then enter the org workspace. All support activity is audit-logged."
      >
        {orgs.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No organizations found.
          </div>
        ) : (
          <>
            {/* Mobile-first cards — no wide table on phones */}
            <ul className="ed-org-control-list lg:hidden">
              {orgs.map((org) => (
                <li key={org.id}>
                  <OrgSupportCard org={org} />
                </li>
              ))}
            </ul>

            {/* Desktop comparison table */}
            <div className="ed-org-control-table hidden lg:block">
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
                      <th className="min-w-[16rem] px-4 py-3 font-medium">
                        Support action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.map((org) => (
                      <tr key={org.id} className="border-t border-border align-top">
                        <td className="px-4 py-3">
                          <AdminLink href={`/platform/organizations/${org.slug}`}>
                            {org.name}
                          </AdminLink>
                          <p className="mt-1 text-xs text-muted-foreground">
                            /{org.slug}
                          </p>
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
                          <SupportEnterForm org={org} dense />
                        </td>
                      </tr>
                    ))}
                    {orgs.length === 0 ? (
                      <EmptyRow colSpan={7} label="No organizations found." />
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Surface>

      <Surface title="Recent support audit trail">
        <div className="divide-y divide-border">
          {supportLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-1.5 px-3 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:px-4"
            >
              <div className="min-w-0">
                <p className="break-words font-medium text-foreground">{log.action}</p>
                <p className="text-xs text-muted-foreground">
                  {log.actor.fullName}
                  {log.org ? ` · ${log.org.name}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
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
