import Link from "next/link";
import {
  ArrowUpRight,
  Crown,
  Search,
  Shield,
  Trash2,
  User2,
} from "lucide-react";
import {
  Badge,
  PageHeader,
  PaginationControls,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  toneForStatus,
} from "../../_components/control-plane";
import {
  CREATE_ERROR_MESSAGES,
  PLATFORM_ROLE_META,
  ROLE_VALUES,
  STATUS_VALUES,
} from "../_lib/constants";
import { getInitials } from "../_lib/helpers";
import { CreatePlatformUserPanel, RoleGuidePanel } from "./users-ui";
import type { getPlatformUsersPageData } from "../_lib/queries";

const USER_COLOR_PALETTE = [
  { surface: "bg-sky-50/80 dark:bg-sky-500/10", bar: "bg-sky-500" },
  { surface: "bg-emerald-50/80 dark:bg-emerald-500/10", bar: "bg-emerald-500" },
  { surface: "bg-violet-50/80 dark:bg-violet-500/10", bar: "bg-violet-500" },
  { surface: "bg-amber-50/80 dark:bg-amber-500/10", bar: "bg-amber-500" },
  { surface: "bg-rose-50/80 dark:bg-rose-500/10", bar: "bg-rose-500" },
  { surface: "bg-cyan-50/80 dark:bg-cyan-500/10", bar: "bg-cyan-500" },
  { surface: "bg-indigo-50/80 dark:bg-indigo-500/10", bar: "bg-indigo-500" },
  { surface: "bg-orange-50/80 dark:bg-orange-500/10", bar: "bg-orange-500" },
] as const;

function colorForUser(userId: string) {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }
  return USER_COLOR_PALETTE[hash % USER_COLOR_PALETTE.length];
}

export type UsersWorkspaceProps = {
  data: Awaited<ReturnType<typeof getPlatformUsersPageData>>;
  flash: { created?: string; createError?: string; archived?: string };
};

export function UsersWorkspace(props: UsersWorkspaceProps) {
  const {
    users,
    totalFiltered,
    totalUsers,
    totalAdmins,
    activeUsers,
    page,
    pageSize,
    q,
    role,
    status,
  } = props.data;
  const params = props.flash;

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-clip">
      <PageHeader
        eyebrow="Identity directory"
        title="Platform users"
        description="Review platform identities, account status, organization memberships, and access information from a read-only directory."
      />

      {params.created ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Platform user created. They will reset their password and accept the
          terms on first sign-in.
        </div>
      ) : null}

      {params.createError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {CREATE_ERROR_MESSAGES[params.createError] ??
            "Could not create this platform user."}
        </div>
      ) : null}

      {params.archived ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Deleted orphan user: {params.archived}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={formatNumber(totalUsers)} />
        <StatCard label="Admins" value={formatNumber(totalAdmins)} />
        <StatCard label="Active" value={formatNumber(activeUsers)} />
        <StatCard label="Matching" value={formatNumber(totalFiltered)} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-4 xl:sticky xl:top-4">
          <RoleGuidePanel />
          <CreatePlatformUserPanel />
        </aside>

        <Surface
          title="User directory"
          description={`${formatNumber(totalFiltered)} matching ${totalFiltered === 1 ? "account" : "accounts"}`}
        >
          <form className="grid gap-3 border-b border-neutral-200 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-neutral-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search name, email, username, or phone"
                className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
              />
            </div>

            <select
              name="role"
              defaultValue={role ?? ""}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 outline-none"
            >
              <option value="">All roles</option>
              {ROLE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 outline-none"
            >
              <option value="">All statuses</option>
              {STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <button className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800">
              Apply
            </button>
          </form>

          {users.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-500">
              No users match the current filters.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto 2xl:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-50 text-left text-neutral-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Memberships</th>
                      <th className="px-4 py-3 font-medium">Permissions</th>
                      <th className="px-4 py-3 font-medium">Last login</th>
                      <th className="px-4 py-3 font-medium">
                        <span className="sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isOrphan =
                        user._count.memberships === 0 &&
                        user._count.platformPermissions === 0;
                      const color = colorForUser(user.id);

                      return (
                        <tr
                          key={user.id}
                          className={`border-t border-neutral-100 align-top ${color.surface}`}
                        >
                          <td className="relative px-5 py-3">
                            <span
                              className={`absolute inset-y-2 left-1.5 w-1 rounded-full ${color.bar}`}
                              aria-hidden="true"
                            />
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-950">
                                {getInitials(user.fullName)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-neutral-950">
                                    {user.fullName}
                                  </p>
                                  {user.isRootSuperAdmin ? (
                                    <Badge>
                                      <span className="inline-flex items-center gap-1">
                                        <Crown className="h-3.5 w-3.5" />
                                        Root
                                      </span>
                                    </Badge>
                                  ) : null}
                                  {isOrphan ? (
                                    <Badge>
                                      <span className="inline-flex items-center gap-1 text-red-700">
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Orphan
                                      </span>
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="mt-1 truncate text-xs text-neutral-500">
                                  {user.email ?? user.username ?? "No email"}
                                </p>
                                {user.phone ? (
                                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                                    {user.phone}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <Badge tone={toneForStatus(user.platformRole)}>
                                <span className="inline-flex items-center gap-1">
                                  <Shield className="h-3.5 w-3.5" />
                                  {user.platformRole}
                                </span>
                              </Badge>
                              <p className="text-xs text-neutral-500">
                                {PLATFORM_ROLE_META[user.platformRole].title}
                              </p>
                              {user.canCreatePlatformAdmins ? (
                                <p className="text-xs font-medium text-neutral-700">
                                  Can create admins
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={toneForStatus(user.status)}>
                              <span className="inline-flex items-center gap-1">
                                <User2 className="h-3.5 w-3.5" />
                                {user.status}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {user._count.memberships}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {user._count.platformPermissions}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                            {formatDateTime(user.lastLoginAt)}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/platform/users/${user.username ?? user.id}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 transition hover:text-neutral-950"
                            >
                              Open
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-neutral-200 2xl:hidden">
                {users.map((user) => {
                  const isOrphan =
                    user._count.memberships === 0 &&
                    user._count.platformPermissions === 0;
                  const color = colorForUser(user.id);

                  return (
                    <Link
                      key={user.id}
                      href={`/platform/users/${user.username ?? user.id}`}
                      className={`relative flex min-w-0 items-start justify-between gap-3 overflow-hidden py-4 pl-5 pr-4 transition hover:brightness-[0.98] ${color.surface}`}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 w-1 ${color.bar}`}
                        aria-hidden="true"
                      />
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-950">
                          {getInitials(user.fullName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-neutral-950">
                              {user.fullName}
                            </p>
                            {user.isRootSuperAdmin ? (
                              <Badge>
                                <span className="inline-flex items-center gap-1">
                                  <Crown className="h-3.5 w-3.5" />
                                  Root
                                </span>
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-xs text-neutral-500">
                            {user.email ?? user.username ?? "No email"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone={toneForStatus(user.platformRole)}>
                              {user.platformRole}
                            </Badge>
                            <Badge tone={toneForStatus(user.status)}>
                              {user.status}
                            </Badge>
                            {isOrphan ? <Badge>Orphan</Badge> : null}
                          </div>
                          <p className="mt-2 text-xs text-neutral-500">
                            {user._count.memberships} memberships ·{" "}
                            {user._count.platformPermissions} permissions
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-neutral-400" />
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={totalFiltered}
            basePath="/platform/users"
            query={{ q, role, status }}
          />
        </Surface>
      </div>
    </div>
  );
}
