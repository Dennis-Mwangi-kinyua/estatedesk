import { PlatformPermissionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Badge,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  labelize,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

const permissionTypes = Object.values(PlatformPermissionType);

export default async function AdminPermissionsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
    },
    orderBy: [{ platformRole: "asc" }, { fullName: "asc" }],
    include: {
      platformPermissions: true,
    },
  });

  const explicitGrants = admins.reduce(
    (sum, admin) => sum + admin.platformPermissions.filter((p) => p.granted).length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin permissions"
        title="Platform access matrix"
        description="Review platform admins, explicit permission overrides, and super-admin capability footprint."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Admins" value={admins.length} />
        <StatCard label="Permission types" value={permissionTypes.length} />
        <StatCard label="Explicit grants" value={explicitGrants} />
        <StatCard label="Root admins" value={admins.filter((admin) => admin.isRootSuperAdmin).length} />
      </section>

      <Surface
        title="Permission matrix"
        description="Each card shows the admin identity, role footprint, creation rights, explicit overrides, and latest platform activity."
      >
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {admins.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-slate-950 dark:text-slate-300 lg:col-span-2">
              No platform admins found.
            </div>
          ) : (
            admins.map((admin) => (
              <article
                key={admin.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-slate-950 dark:text-white">
                      {admin.fullName}
                    </h3>
                    <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-300">
                      {admin.email ?? admin.username ?? "-"}
                    </p>
                  </div>
                  <Badge>{labelize(admin.platformRole)}</Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Root
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {admin.isRootSuperAdmin ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Create admins
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {admin.canCreatePlatformAdmins ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Last login
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                      {formatDateTime(admin.lastLoginAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Explicit permissions
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {admin.platformPermissions.length === 0 ? (
                      <span className="text-sm text-slate-500 dark:text-slate-300">
                        No overrides
                      </span>
                    ) : (
                      admin.platformPermissions.map((permission) => (
                        <Badge key={permission.id}>
                          {permission.granted ? "" : "No "}
                          {labelize(permission.permission)}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </Surface>

      <Surface
        title="Permission catalog"
        description="Reference list of platform capabilities available for direct grants or revocations."
      >
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {permissionTypes.map((permission) => (
            <div
              key={permission}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
            >
              {labelize(permission)}
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
