import { PlatformPermissionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Badge,
  EmptyRow,
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

      <Surface title="Permission matrix">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Root</th>
                <th className="px-4 py-3 font-medium">Create admins</th>
                <th className="px-4 py-3 font-medium">Explicit permissions</th>
                <th className="px-4 py-3 font-medium">Last login</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-neutral-950">{admin.fullName}</p>
                    <p className="mt-1 text-xs text-neutral-500">{admin.email ?? admin.username ?? "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{admin.platformRole}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        admin.isRootSuperAdmin
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600"
                      }
                    >
                      {admin.isRootSuperAdmin ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        admin.canCreatePlatformAdmins
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600"
                      }
                    >
                      {admin.canCreatePlatformAdmins ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[520px] flex-wrap gap-1.5">
                      {admin.platformPermissions.length === 0 ? (
                        <span className="text-neutral-500">No overrides</span>
                      ) : (
                        admin.platformPermissions.map((permission) => (
                          <Badge
                            key={permission.id}
                            tone={
                              permission.granted
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            }
                          >
                            {labelize(permission.permission)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(admin.lastLoginAt)}</td>
                </tr>
              ))}
              {admins.length === 0 ? <EmptyRow colSpan={6} label="No platform admins found." /> : null}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface title="Permission catalog">
        <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {permissionTypes.map((permission) => (
            <div key={permission} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm font-medium text-neutral-700">
              {labelize(permission)}
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
