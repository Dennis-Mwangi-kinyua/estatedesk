import { SubmitButton } from "./submit-button";
import { deletePlatformAdmin } from "../_lib/actions";
import { formatDate } from "../_lib/helpers";
import type { AdminRecord } from "../_lib/types";

export function PageHeader() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
        Platform Admins
      </h1>
      <p className="text-sm leading-6 text-muted-foreground">
        Create admin accounts, define responsibilities, and review platform access
        in one workspace.
      </p>
    </div>
  );
}

function deleteGuard(admin: AdminRecord, activeAdminCount: number) {
  if (admin.isRootSuperAdmin) {
    return {
      canDelete: false,
      reason: "Root super admin cannot be deleted.",
    };
  }

  // Deleting the last ACTIVE platform admin would lock out the control plane.
  if (admin.status === "ACTIVE" && activeAdminCount <= 1) {
    return {
      canDelete: false,
      reason: "Cannot delete the last active platform admin.",
    };
  }

  return { canDelete: true, reason: null as string | null };
}

export function AdminsCard({
  admins,
  activeAdminCount,
}: {
  admins: AdminRecord[];
  activeAdminCount: number;
}) {
  const lastActiveProtected = activeAdminCount <= 1;

  return (
    <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="border-b px-3 py-3 sm:px-5 sm:py-4">
        <h2 className="text-base font-semibold text-foreground">Admins</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {admins.length} {admins.length === 1 ? "admin" : "admins"} found
          {lastActiveProtected ? (
            <span className="mt-1 block text-amber-800 dark:text-amber-200">
              At least one active platform admin must remain. Delete is faded for
              the last active admin.
            </span>
          ) : null}
        </p>
      </div>

      {admins.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y">
          {admins.map((admin) => {
            const guard = deleteGuard(admin, activeAdminCount);
            return (
              <AdminRow
                key={admin.id}
                admin={admin}
                canDelete={guard.canDelete}
                deleteBlockedReason={guard.reason}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export function EmptyState() {
  return (
    <div className="flex min-h-[160px] items-center justify-center p-6 text-center text-sm text-muted-foreground sm:p-8">
      No platform admins found.
    </div>
  );
}

export function AdminRow({
  admin,
  canDelete,
  deleteBlockedReason,
}: {
  admin: AdminRecord;
  canDelete: boolean;
  deleteBlockedReason?: string | null;
}) {
  const displayName = admin.fullName?.trim() || "Unnamed Admin";

  return (
    <article className="space-y-4 p-3 sm:p-5">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <h3 className="text-base font-semibold leading-6 text-foreground sm:text-lg">
            {displayName}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {admin.platformRole ? (
              <Badge variant="default">{formatRole(admin.platformRole)}</Badge>
            ) : null}

            {admin.isRootSuperAdmin ? <Badge variant="danger">ROOT</Badge> : null}

            {admin.canCreatePlatformAdmins ? (
              <Badge variant="info">CAN CREATE ADMINS</Badge>
            ) : null}

            {admin.emailVerified ? (
              <Badge variant="success">EMAIL VERIFIED</Badge>
            ) : null}

            {admin.phoneVerified ? (
              <Badge variant="success">PHONE VERIFIED</Badge>
            ) : null}

            <StatusBadge status={admin.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground min-[480px]:grid-cols-2">
          <p className="min-w-0 break-words">
            <span className="font-medium text-foreground">Username:</span>{" "}
            {admin.username ?? "—"}
          </p>

          <p className="min-w-0 break-words">
            <span className="font-medium text-foreground">Email:</span>{" "}
            {admin.email ?? "—"}
          </p>

          <p className="min-w-0 break-words">
            <span className="font-medium text-foreground">Phone:</span>{" "}
            {admin.phone ?? "—"}
          </p>

          <p className="min-w-0">
            <span className="font-medium text-foreground">Role:</span>{" "}
            {admin.platformRole ? formatRole(admin.platformRole) : "—"}
          </p>

          <p className="min-w-0">
            <span className="font-medium text-foreground">Created:</span>{" "}
            {formatDate(admin.createdAt)}
          </p>

          <p className="min-w-0">
            <span className="font-medium text-foreground">Status:</span>{" "}
            {admin.status}
          </p>
        </div>
      </div>

      <PermissionsSection permissions={admin.platformPermissions} />

      <details className="group border-t border-border pt-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-muted-foreground">Remove account access</summary>
        <div className="mt-2 space-y-3 rounded-xl border bg-muted/20 p-3">
        <p className="text-sm text-muted-foreground">Deleting this admin removes their platform account. Review the identity and permissions above before continuing.</p>
        <form action={deletePlatformAdmin} className="w-full">
          <input type="hidden" name="userId" value={admin.id} />
          <SubmitButton pendingLabel="Deleting…"
            disabled={!canDelete}
            title={deleteBlockedReason ?? "Delete this platform admin"}
            className={[
              "inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold transition",
              canDelete
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
                : "cursor-not-allowed border-border bg-muted/40 text-muted-foreground opacity-50",
            ].join(" ")}
          >
            Delete Admin
          </SubmitButton>
        </form>
        {!canDelete && deleteBlockedReason ? (
          <p className="text-center text-xs leading-5 text-muted-foreground">
            {deleteBlockedReason}
          </p>
        ) : null}
        </div>
      </details>
    </article>
  );
}

export function PermissionsSection({
  permissions,
}: {
  permissions: AdminRecord["platformPermissions"];
}) {
  return (
    <details className="rounded-xl border bg-muted/20 p-3">
      <summary className="cursor-pointer text-sm font-medium text-foreground">Review permissions ({permissions.length})</summary>
      <div className="mt-3">

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
                "inline-flex max-w-full items-center rounded-lg border px-3 py-1.5 text-xs font-medium",
                permission.granted
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
              ].join(" ")}
            >
              {formatRole(permission.permission)} ·{" "}
              {permission.granted ? "Granted" : "Revoked"}
            </span>
          ))}
        </div>
      )}
      </div>
    </details>
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
    success: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200",
    danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
    info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
    muted: "border-border bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`platform-badge inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
