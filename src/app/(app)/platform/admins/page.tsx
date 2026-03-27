import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export default async function PlatformAdminsPage() {
  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { platformRole: "PLATFORM_ADMIN" },
        { platformRole: "SUPER_ADMIN" },
        { isRootSuperAdmin: true },
        { canCreatePlatformAdmins: true },
      ],
    },
    orderBy: [{ isRootSuperAdmin: "desc" }, { createdAt: "desc" }],
    include: {
      platformPermissions: {
        orderBy: { permission: "asc" },
      },
    },
  });

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Platform Admins</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage super admins, platform admins, and their permissions.
        </p>
      </div>

      <div className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Admins</h2>
        </div>

        {admins.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No platform admins found.</div>
        ) : (
          <div className="divide-y">
            {admins.map((admin) => (
              <div key={admin.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{admin.fullName}</h3>
                  <Badge>{admin.platformRole}</Badge>
                  {admin.isRootSuperAdmin && <Badge>ROOT</Badge>}
                  {admin.canCreatePlatformAdmins && <Badge>CAN_CREATE_ADMINS</Badge>}
                  <Badge>{admin.status}</Badge>
                </div>

                <div className="grid gap-2 md:grid-cols-3 text-sm text-muted-foreground">
                  <p>Email: {admin.email ?? "—"}</p>
                  <p>Phone: {admin.phone ?? "—"}</p>
                  <p>Created: {formatDate(admin.createdAt)}</p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Permissions</p>
                  {admin.platformPermissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No explicit platform permissions.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {admin.platformPermissions.map((permission) => (
                        <span
                          key={permission.id}
                          className="inline-flex rounded-full border px-3 py-1 text-xs"
                        >
                          {permission.permission} · {permission.granted ? "Granted" : "Revoked"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
      {children}
    </span>
  );
}