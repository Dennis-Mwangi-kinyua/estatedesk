import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  PlatformPermissionType,
  PlatformRole,
  UserStatus,
  type Prisma,
} from "@prisma/client";
import { hash } from "bcryptjs";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

const ALL_PLATFORM_PERMISSIONS = Object.values(PlatformPermissionType);

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return dateFormatter.format(value);
}

const adminSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  createdAt: true,
  status: true,
  platformRole: true,
  isRootSuperAdmin: true,
  canCreatePlatformAdmins: true,
  platformPermissions: {
    orderBy: { permission: "asc" },
    select: {
      id: true,
      permission: true,
      granted: true,
    },
  },
} satisfies Prisma.UserSelect;

type AdminRecord = Prisma.UserGetPayload<{
  select: typeof adminSelect;
}>;

async function getPlatformAdmins(): Promise<AdminRecord[]> {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { platformRole: PlatformRole.PLATFORM_ADMIN },
        { platformRole: PlatformRole.SUPER_ADMIN },
        { isRootSuperAdmin: true },
        { canCreatePlatformAdmins: true },
      ],
    },
    orderBy: [
      { isRootSuperAdmin: "desc" },
      { canCreatePlatformAdmins: "desc" },
      { createdAt: "desc" },
    ],
    select: adminSelect,
  });
}

async function createPlatformAdmin(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const platformRoleRaw = String(formData.get("platformRole") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  const canCreatePlatformAdmins =
    String(formData.get("canCreatePlatformAdmins") ?? "") === "on";
  const isRootSuperAdmin =
    String(formData.get("isRootSuperAdmin") ?? "") === "on";

  const selectedPermissions = formData
    .getAll("permissions")
    .map((value) => String(value))
    .filter((value): value is PlatformPermissionType =>
      ALL_PLATFORM_PERMISSIONS.includes(value as PlatformPermissionType),
    );

  const platformRole = Object.values(PlatformRole).includes(
    platformRoleRaw as PlatformRole,
  )
    ? (platformRoleRaw as PlatformRole)
    : PlatformRole.PLATFORM_ADMIN;

  const status = Object.values(UserStatus).includes(statusRaw as UserStatus)
    ? (statusRaw as UserStatus)
    : UserStatus.ACTIVE;

  if (!fullName) {
    throw new Error("Full name is required.");
  }

  if (!email) {
    throw new Error("Email is required.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (isRootSuperAdmin && platformRole !== PlatformRole.SUPER_ADMIN) {
    throw new Error("Root super admin must have SUPER_ADMIN role.");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(phoneRaw ? [{ phone: phoneRaw }] : [])],
    },
    select: {
      id: true,
      email: true,
      phone: true,
    },
  });

  if (existingUser) {
    throw new Error("A user with that email or phone already exists.");
  }

  const passwordHash = await hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName,
        email,
        phone: phoneRaw || null,
        passwordHash,
        status,
        platformRole,
        canCreatePlatformAdmins,
        isRootSuperAdmin,
      },
      select: {
        id: true,
      },
    });

    if (selectedPermissions.length > 0) {
      await tx.platformPermission.createMany({
        data: selectedPermissions.map((permission) => ({
          userId: user.id,
          permission,
          granted: true,
        })),
      });
    }
  });

  revalidatePath("/platform/admins");
}

export default async function PlatformAdminsPage() {
  const admins = await getPlatformAdmins();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader />
      <CreateAdminSection />
      <AdminsCard admins={admins} />
    </div>
  );
}

function PageHeader() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Platform Admins
      </h1>
      <p className="text-sm text-muted-foreground">
        Manage super admins, platform admins, login credentials, and platform permissions.
      </p>
    </div>
  );
}

function CreateAdminSection() {
  return (
    <section className="rounded-2xl border bg-background shadow-sm">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Add Platform Admin
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a new admin account and assign platform rights.
            </p>
          </div>

          <span className="inline-flex min-h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition group-open:bg-muted group-open:text-foreground">
            Add Admin
          </span>
        </summary>

        <div className="border-t px-4 py-4 sm:px-5">
          <form action={createPlatformAdmin} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="fullName">
                <input
                  id="fullName"
                  name="fullName"
                  required
                  placeholder="Enter full name"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Email (used as username)" htmlFor="email">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@estatedesk.com"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Phone" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  placeholder="Optional phone number"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Password" htmlFor="password">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                />
              </Field>

              <Field label="Platform role" htmlFor="platformRole">
                <select
                  id="platformRole"
                  name="platformRole"
                  defaultValue={PlatformRole.PLATFORM_ADMIN}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                >
                  <option value={PlatformRole.PLATFORM_ADMIN}>PLATFORM_ADMIN</option>
                  <option value={PlatformRole.SUPER_ADMIN}>SUPER_ADMIN</option>
                </select>
              </Field>

              <Field label="Status" htmlFor="status">
                <select
                  id="status"
                  name="status"
                  defaultValue={UserStatus.ACTIVE}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40"
                >
                  <option value={UserStatus.ACTIVE}>ACTIVE</option>
                  <option value={UserStatus.SUSPENDED}>SUSPENDED</option>
                  <option value={UserStatus.DISABLED}>DISABLED</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 rounded-2xl border p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="canCreatePlatformAdmins"
                  className="mt-1 h-4 w-4 rounded border"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Can create platform admins
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Allows this admin to create other platform admins.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="isRootSuperAdmin"
                  className="mt-1 h-4 w-4 rounded border"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Root super admin
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Highest-level admin. Use carefully.
                  </p>
                </div>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Platform permissions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select the rights this admin should have.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ALL_PLATFORM_PERMISSIONS.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-start gap-3 rounded-2xl border p-3"
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={permission}
                      className="mt-1 h-4 w-4 rounded border"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatRole(permission)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
              >
                Create Admin
              </button>
            </div>
          </form>
        </div>
      </details>
    </section>
  );
}

function AdminsCard({ admins }: { admins: AdminRecord[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Admins</h2>
          <p className="text-sm text-muted-foreground">
            {admins.length} {admins.length === 1 ? "admin" : "admins"} found
          </p>
        </div>
      </div>

      {admins.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y">
          {admins.map((admin) => (
            <AdminRow key={admin.id} admin={admin} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[180px] items-center justify-center p-8 text-sm text-muted-foreground">
      No platform admins found.
    </div>
  );
}

function AdminRow({ admin }: { admin: AdminRecord }) {
  const displayName = admin.fullName?.trim() || "Unnamed Admin";

  return (
    <article className="space-y-4 p-4 sm:p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{displayName}</h3>

          {admin.platformRole && (
            <Badge variant="default">{formatRole(admin.platformRole)}</Badge>
          )}

          {admin.isRootSuperAdmin && <Badge variant="danger">ROOT</Badge>}

          {admin.canCreatePlatformAdmins && (
            <Badge variant="info">CAN_CREATE_ADMINS</Badge>
          )}

          <StatusBadge status={admin.status} />
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          <p>
            <span className="font-medium text-foreground">Email:</span>{" "}
            {admin.email ?? "—"}
          </p>
          <p>
            <span className="font-medium text-foreground">Phone:</span>{" "}
            {admin.phone ?? "—"}
          </p>
          <p>
            <span className="font-medium text-foreground">Created:</span>{" "}
            {formatDate(admin.createdAt)}
          </p>
        </div>
      </div>

      <PermissionsSection permissions={admin.platformPermissions} />
    </article>
  );
}

function PermissionsSection({
  permissions,
}: {
  permissions: AdminRecord["platformPermissions"];
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Permissions</p>

      {permissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No explicit platform permissions.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {permissions.map((permission) => (
            <span
              key={permission.id}
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                permission.granted
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700",
              ].join(" ")}
            >
              {formatRole(permission.permission)} ·{" "}
              {permission.granted ? "Granted" : "Revoked"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const variant =
    normalized === "ACTIVE"
      ? "success"
      : normalized === "SUSPENDED" || normalized === "DISABLED"
        ? "danger"
        : "muted";

  return <Badge variant={variant}>{normalized}</Badge>;
}

function formatRole(role: string) {
  return role.replaceAll("_", " ");
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "info" | "muted";
}) {
  const variants: Record<typeof variant, string> = {
    default: "border-border bg-muted/40 text-foreground",
    success: "border-green-200 bg-green-50 text-green-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    muted: "border-border bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}