import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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

export function PermissionsWorkspace({
  data,
}: {
  data: Awaited<ReturnType<typeof getAdminPermissionsPageData>>;
}) {
  const { admins, explicitGrants, rootAdmins } = data;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin permissions"
        title="Platform access matrix"
        description="Review platform admins, explicit permission overrides, and super-admin capability footprint."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Admins" value={formatNumber(admins.length)} />
        <StatCard label="Permission types" value={formatNumber(PERMISSION_TYPES.length)} />
        <StatCard label="Explicit grants" value={formatNumber(explicitGrants)} />
        <StatCard label="Root admins" value={formatNumber(rootAdmins)} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:items-start">
        <aside className="xl:sticky xl:top-4">
          <Surface
            title="Permission catalog"
            description="Capabilities available for direct grants or revocations."
          >
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {PERMISSION_TYPES.map((permission) => (
                <li
                  key={permission}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {labelize(permission)}
                </li>
              ))}
            </ul>
          </Surface>
        </aside>

        <Surface
          title="Admin matrix"
          description={`${formatNumber(admins.length)} platform ${admins.length === 1 ? "admin" : "admins"}`}
        >
          {admins.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-300">
              No platform admins found.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Admin</th>
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
                    {admins.map((admin) => {
                      const granted = admin.platformPermissions.filter(
                        (permission) => permission.granted,
                      ).length;
                      const revoked = admin.platformPermissions.length - granted;

                      return (
                        <tr
                          key={admin.id}
                          className="border-t border-slate-200 align-top dark:border-white/10"
                        >
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-950 dark:text-white">
                              {admin.fullName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {admin.email ?? admin.username ?? "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge>{labelize(admin.platformRole)}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {admin.isRootSuperAdmin ? "Yes" : "No"}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {admin.canCreatePlatformAdmins ? "Yes" : "No"}
                          </td>
                          <td className="px-4 py-3">
                            {admin.platformPermissions.length === 0 ? (
                              <span className="text-slate-500 dark:text-slate-400">
                                None
                              </span>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                                    <Badge>
                                      +{admin.platformPermissions.length - 4} more
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                            {formatDateTime(admin.lastLoginAt)}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/platform/users/${admin.username ?? admin.id}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 transition hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
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

              <div className="divide-y divide-slate-200 dark:divide-white/10 md:hidden">
                {admins.map((admin) => {
                  const granted = admin.platformPermissions.filter(
                    (permission) => permission.granted,
                  ).length;
                  const revoked = admin.platformPermissions.length - granted;

                  return (
                    <Link
                      key={admin.id}
                      href={`/platform/users/${admin.username ?? admin.id}`}
                      className="block px-4 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-900/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950 dark:text-white">
                            {admin.fullName}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {admin.email ?? admin.username ?? "—"}
                          </p>
                        </div>
                        <Badge>{labelize(admin.platformRole)}</Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span>Root: {admin.isRootSuperAdmin ? "Yes" : "No"}</span>
                        <span>
                          Create admins:{" "}
                          {admin.canCreatePlatformAdmins ? "Yes" : "No"}
                        </span>
                        <span className="col-span-2">
                          Overrides:{" "}
                          {admin.platformPermissions.length === 0
                            ? "None"
                            : `${granted} granted · ${revoked} revoked`}
                        </span>
                        <span className="col-span-2">
                          Last login: {formatDateTime(admin.lastLoginAt)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </Surface>
      </div>
    </div>
  );
}