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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Identity directory"
        title="Platform users"
        description="Create platform users, assign system roles, review memberships, and clean up orphan accounts from one control surface."
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
              <div className="hidden overflow-x-auto md:block">
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

                      return (
                        <tr
                          key={user.id}
                          className="border-t border-neutral-100 align-top"
                        >
                          <td className="px-4 py-3">
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

              <div className="divide-y divide-neutral-200 md:hidden">
                {users.map((user) => {
                  const isOrphan =
                    user._count.memberships === 0 &&
                    user._count.platformPermissions === 0;

                  return (
                    <Link
                      key={user.id}
                      href={`/platform/users/${user.username ?? user.id}`}
                      className="flex items-start justify-between gap-3 px-4 py-4 transition hover:bg-neutral-50"
                    >
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