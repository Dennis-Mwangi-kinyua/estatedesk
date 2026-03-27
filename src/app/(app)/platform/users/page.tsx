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

export default async function PlatformUsersPage() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      platformPermissions: {
        orderBy: { permission: "asc" },
      },
      memberships: {
        take: 5,
        include: {
          org: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Platform Users</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          All users, platform roles, and recent organization memberships.
        </p>
      </div>

      <div className="rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Users</h2>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No users found.</div>
        ) : (
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{user.fullName}</h3>
                  <Badge>{user.platformRole}</Badge>
                  <Badge>{user.status}</Badge>
                  {user.isRootSuperAdmin && <Badge>ROOT</Badge>}
                  {user.canCreatePlatformAdmins && <Badge>CAN_CREATE_ADMINS</Badge>}
                </div>

                <div className="grid gap-2 md:grid-cols-4 text-sm text-muted-foreground">
                  <p>Email: {user.email ?? "—"}</p>
                  <p>Phone: {user.phone ?? "—"}</p>
                  <p>Created: {formatDate(user.createdAt)}</p>
                  <p>Last login: {formatDate(user.lastLoginAt)}</p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Memberships</p>
                  {user.memberships.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No memberships.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user.memberships.map((membership) => (
                        <span
                          key={membership.id}
                          className="inline-flex rounded-full border px-3 py-1 text-xs"
                        >
                          {membership.org.name} · {membership.role} · {membership.scopeType}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Platform Permissions</p>
                  {user.platformPermissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No explicit platform permissions.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user.platformPermissions.map((permission) => (
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