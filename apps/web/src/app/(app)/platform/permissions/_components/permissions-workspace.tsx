import Link from "next/link";
import { ArrowUpRight, KeyRound, Shield, UserCog } from "lucide-react";
import {
  Badge,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  labelize,
} from "../../_components/control-plane";
import { PERMISSION_TYPES } from "../_lib/queries";
import type { getAdminPermissionsPageData } from "../_lib/queries";

type AdminRow = Awaited<
  ReturnType<typeof getAdminPermissionsPageData>
>["admins"][number];

function adminOverrides(admin: AdminRow) {
  const granted = admin.platformPermissions.filter((p) => p.granted).length;
  const revoked = admin.platformPermissions.length - granted;
  return { granted, revoked };
}

function AdminMatrixCard({ admin }: { admin: AdminRow }) {
  const { granted, revoked } = adminOverrides(admin);
  const contact = admin.email ?? admin.username ?? "—";
  const href = `/platform/users/${admin.username ?? admin.id}`;

  return (
    <article className="min-w-0 border-b border-border last:border-b-0">
      <div className="space-y-3 px-3 py-3.5 sm:px-4 sm:py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-semibold leading-5 text-foreground">
              {admin.fullName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {contact}
            </p>
          </div>
          <Badge
            tone={
              admin.isRootSuperAdmin
                ? "border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100"
                : undefined
            }
          >
            {labelize(admin.platformRole)}
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-2.5 text-[11px] sm:text-xs">
          <div className="min-w-0">
            <dt className="font-medium text-muted-foreground">Root</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {admin.isRootSuperAdmin ? "Yes" : "No"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-muted-foreground">Create admins</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {admin.canCreatePlatformAdmins ? "Yes" : "No"}
            </dd>
          </div>
          <div className="min-w-0 col-span-2">
            <dt className="font-medium text-muted-foreground">Last login</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {formatDateTime(admin.lastLoginAt)}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            Permission overrides
            {admin.platformPermissions.length > 0
              ? ` · ${granted} granted · ${revoked} revoked`
              : " · None"}
          </p>
          {admin.platformPermissions.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {admin.platformPermissions.map((permission) => (
                <Badge
                  key={permission.id}
                  tone={
                    permission.granted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                      : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
                  }
                >
                  {permission.granted ? "" : "No "}
                  {labelize(permission.permission)}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <Link
          href={href}
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted/60 active:scale-[0.99] sm:w-auto sm:justify-start"
        >
          Open profile
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function AdminMatrixTableRow({ admin }: { admin: AdminRow }) {
  const { granted, revoked } = adminOverrides(admin);

  return (
    <tr className="border-t border-border align-top">
      <td className="px-4 py-3">
        <p className="font-semibold text-foreground">{admin.fullName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {admin.email ?? admin.username ?? "—"}
        </p>
      </td>
      <td className="px-4 py-3">
        <Badge>{labelize(admin.platformRole)}</Badge>
      </td>
      <td className="px-4 py-3 text-foreground">
        {admin.isRootSuperAdmin ? "Yes" : "No"}
      </td>
      <td className="px-4 py-3 text-foreground">
        {admin.canCreatePlatformAdmins ? "Yes" : "No"}
      </td>
      <td className="px-4 py-3">
        {admin.platformPermissions.length === 0 ? (
          <span className="text-muted-foreground">None</span>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {granted} granted · {revoked} revoked
            </p>
            <div className="flex max-w-[280px] flex-wrap gap-1.5">
              {admin.platformPermissions.slice(0, 4).map((permission) => (
                <Badge key={permission.id}>
                  {permission.granted ? "" : "No "}
                  {labelize(permission.permission)}
                </Badge>
              ))}
              {admin.platformPermissions.length > 4 ? (
                <Badge>+{admin.platformPermissions.length - 4} more</Badge>
              ) : null}
            </div>
          </div>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
        {formatDateTime(admin.lastLoginAt)}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/platform/users/${admin.username ?? admin.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Open
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}

export function PermissionsWorkspace({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminPermissionsPageData>>;
}) {
  const { admins, explicitGrants, rootAdmins } = data;

  return (
    <div className="ed-mobile-first space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Admin permissions"
        title="Platform access matrix"
        description="Review platform admins, explicit permission overrides, and super-admin capability footprint."
      />

      <section className="ed-keep-cols grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Admins" value={formatNumber(admins.length)} />
        <StatCard
          label="Permission types"
          value={formatNumber(PERMISSION_TYPES.length)}
        />
        <StatCard label="Explicit grants" value={formatNumber(explicitGrants)} />
        <StatCard label="Root admins" value={formatNumber(rootAdmins)} />
      </section>

      {/* Mobile-first: catalog first as chips, then matrix cards. Desktop: sidebar + table. */}
      <div className="grid min-w-0 gap-4 lg:gap-5 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)] xl:items-start">
        <aside className="min-w-0 xl:sticky xl:top-4">
          <Surface
            title="Permission catalog"
            description="Capabilities available for direct grants or revocations."
          >
            {/* Phone / tablet: wrap chips (no tall list eat the screen) */}
            <ul className="flex flex-wrap gap-1.5 p-3 sm:p-4 xl:hidden">
              {PERMISSION_TYPES.map((permission) => (
                <li key={permission}>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground sm:text-xs">
                    <KeyRound className="h-3 w-3 shrink-0 text-muted-foreground" />
                    {labelize(permission)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Wide desktop: stacked catalog */}
            <ul className="hidden divide-y divide-border xl:block">
              {PERMISSION_TYPES.map((permission) => (
                <li
                  key={permission}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground"
                >
                  <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {labelize(permission)}
                </li>
              ))}
            </ul>
          </Surface>
        </aside>

        <Surface
          title="Admin matrix"
          description={`${formatNumber(admins.length)} platform ${
            admins.length === 1 ? "admin" : "admins"
          }`}
        >
          {admins.length === 0 ? (
            <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <UserCog className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No platform admins found.</p>
            </div>
          ) : (
            <>
              {/* Default: card list (mobile-first). Table only from lg up. */}
              <ul className="ed-access-matrix-list lg:hidden">
                {admins.map((admin) => (
                  <li key={admin.id}>
                    <AdminMatrixCard admin={admin} />
                  </li>
                ))}
              </ul>

              <div className="ed-access-matrix-table hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40 text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                            Admin
                          </span>
                        </th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Root</th>
                        <th className="px-4 py-3 font-medium">Create admins</th>
                        <th className="px-4 py-3 font-medium">Overrides</th>
                        <th className="px-4 py-3 font-medium">Last login</th>
                        <th className="px-4 py-3 font-medium">
                          <span className="sr-only">Open</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <AdminMatrixTableRow key={admin.id} admin={admin} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </Surface>
      </div>
    </div>
  );
}
