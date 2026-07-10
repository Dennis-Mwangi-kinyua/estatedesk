import { deletePlatformAdmin } from "../_lib/actions";
import { formatDate } from "../_lib/helpers";
import type { AdminRecord } from "../_lib/types";

export function PageHeader() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Platform Admins
      </h1>
      <p className="text-sm text-muted-foreground">
        Manage verified admin usernames, secure login credentials, roles, and
        platform permissions.
      </p>
    </div>
  );
}

export function AdminsCard({ admins }: { admins: AdminRecord[] }) {
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

export function EmptyState() {
  return (
    <div className="flex min-h-[180px] items-center justify-center p-8 text-sm text-muted-foreground">
      No platform admins found.
    </div>
  );
}

export function AdminRow({ admin }: { admin: AdminRecord }) {
  const displayName = admin.fullName?.trim() || "Unnamed Admin";

  return (
    <article className="space-y-4 p-4 sm:p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            {displayName}
          </h3>

          {admin.platformRole && (
            <Badge variant="default">{formatRole(admin.platformRole)}</Badge>
          )}

          {admin.isRootSuperAdmin && <Badge variant="danger">ROOT</Badge>}

          {admin.canCreatePlatformAdmins && (
            <Badge variant="info">CAN CREATE ADMINS</Badge>
          )}

          {admin.emailVerified && <Badge variant="success">EMAIL VERIFIED</Badge>}

          {admin.phoneVerified && <Badge variant="success">PHONE VERIFIED</Badge>}

          <StatusBadge status={admin.status} />
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          <p>
            <span className="font-medium text-foreground">Username:</span>{" "}
            {admin.username ?? "—"}
          </p>

          <p>
            <span className="font-medium text-foreground">Email:</span>{" "}
            {admin.email ?? "—"}
          </p>

          <p>
            <span className="font-medium text-foreground">Phone:</span>{" "}
            {admin.phone ?? "—"}
          </p>

          <p>
            <span className="font-medium text-foreground">Role:</span>{" "}
            {admin.platformRole ? formatRole(admin.platformRole) : "—"}
          </p>

          <p>
            <span className="font-medium text-foreground">Created:</span>{" "}
            {formatDate(admin.createdAt)}
          </p>

          <p>
            <span className="font-medium text-foreground">Status:</span>{" "}
            {admin.status}
          </p>
        </div>
      </div>

      <PermissionsSection permissions={admin.platformPermissions} />

      <div className="flex justify-end">
        <form action={deletePlatformAdmin} className="inline">
          <input type="hidden" name="userId" value={admin.id} />
          <button
            type="submit"
            className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700 hover:opacity-90"
          >
            Delete Admin
          </button>
        </form>
      </div>
    </article>
  );
}

export function PermissionsSection({
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

export function Field({
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
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const variant =
    normalized === "ACTIVE"
      ? "success"
      : normalized === "SUSPENDED" || normalized === "DISABLED"
        ? "danger"
        : "muted";

  return <Badge variant={variant}>{normalized}</Badge>;
}

export function formatRole(role: string) {
  return role.replaceAll("_", " ");
}

export function Badge({
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