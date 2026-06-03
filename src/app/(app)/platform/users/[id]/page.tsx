import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformPermissionType, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Crown,
  KeyRound,
  LogIn,
  Mail,
  Phone,
  Save,
  Shield,
  Trash2,
  User2,
  Users,
  XCircle,
} from "lucide-react";
import {
  archiveOrphanPlatformUser,
  resetPlatformUserPassword,
  updatePlatformUserPermissions,
  updatePlatformUserProfile,
  updatePlatformUserStatus,
} from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function getInitials(name: string | null | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getNotice(params?: { error?: string; updated?: string }) {
  if (params?.updated === "status") {
    return {
      tone: "success" as const,
      message: "User status updated.",
    };
  }

  if (params?.updated === "profile") {
    return {
      tone: "success" as const,
      message: "User profile updated.",
    };
  }

  if (params?.updated === "permissions") {
    return {
      tone: "success" as const,
      message: "Platform permissions updated.",
    };
  }

  if (params?.updated === "password") {
    return {
      tone: "success" as const,
      message: "Temporary password set. The user must change it on next login.",
    };
  }

  if (params?.error === "self-status") {
    return {
      tone: "error" as const,
      message: "You cannot change your own platform account status.",
    };
  }

  if (params?.error === "self-archive") {
    return {
      tone: "error" as const,
      message: "You cannot archive your own platform account.",
    };
  }

  if (params?.error === "root-protected") {
    return {
      tone: "error" as const,
      message: "Root super admin accounts are protected from this action.",
    };
  }

  if (params?.error === "not-orphan") {
    return {
      tone: "error" as const,
      message:
        "This user still has memberships or platform permissions and cannot be archived as an orphan.",
    };
  }

  if (params?.error === "confirm-archive") {
    return {
      tone: "error" as const,
      message: "Confirmation did not match. Type the shown value exactly.",
    };
  }

  if (params?.error === "duplicate") {
    return {
      tone: "error" as const,
      message: "Another user already uses that username, email, or phone.",
    };
  }

  if (params?.error === "password") {
    return {
      tone: "error" as const,
      message: "Password must be at least 8 characters and both fields must match.",
    };
  }

  if (params?.error === "super-admin") {
    return {
      tone: "error" as const,
      message: "Only a super admin can assign the super admin role.",
    };
  }

  return null;
}

type PlatformUserDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    updated?: string;
  }>;
};

export default async function PlatformUserDetailsPage({
  params,
  searchParams,
}: PlatformUserDetailsPageProps) {
  const { id } = await params;
  const paramsValue = await searchParams;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id }, { username: id }, { slug: id }],
      deletedAt: null,
    },
    include: {
      platformPermissions: {
        orderBy: { permission: "asc" },
      },
      memberships: {
        orderBy: { createdAt: "desc" },
        include: {
          org: {
            select: {
              id: true,
              name: true,
              slug: true,
              createdAt: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!user) notFound();

  const grantedPermissions = user.platformPermissions.filter((p) => p.granted);
  const revokedPermissions = user.platformPermissions.filter((p) => !p.granted);
  const isOrphanUser =
    user.memberships.length === 0 && user.platformPermissions.length === 0;
  const archiveConfirmation = user.username || user.email || user.fullName;
  const notice = getNotice(paramsValue);
  const grantedPermissionSet = new Set(
    user.platformPermissions
      .filter((permission) => permission.granted)
      .map((permission) => permission.permission),
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-neutral-200 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/platform/users"
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Platform Users
            </Link>

            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
              User Details
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Complete profile, platform access, and organization membership details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MetricCard
              label="Memberships"
              value={user.memberships.length}
              icon={<Building2 className="h-4 w-4" />}
            />
            <MetricCard
              label="Permissions"
              value={user.platformPermissions.length}
              icon={<Shield className="h-4 w-4" />}
            />
            <MetricCard
              label="Granted"
              value={grantedPermissions.length}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
        {notice ? (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              notice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-100 text-xl font-semibold text-neutral-900">
                    {getInitials(user.fullName)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-2xl font-semibold text-neutral-950">
                        {user.fullName}
                      </h2>

                      {user.isRootSuperAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
                          <Crown className="h-3.5 w-3.5" />
                          ROOT
                        </span>
                      )}
                    </div>

                    <p className="mt-1 break-all text-sm text-neutral-500">
                      {user.email ?? "No email provided"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag icon={<Shield className="h-3.5 w-3.5" />}>
                        {String(user.platformRole)}
                      </Tag>
                      <Tag icon={<User2 className="h-3.5 w-3.5" />}>
                        {String(user.status)}
                      </Tag>
                      {user.canCreatePlatformAdmins && (
                        <Tag icon={<KeyRound className="h-3.5 w-3.5" />}>
                          CAN_CREATE_ADMINS
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                  value={user.email ?? "—"}
                  breakValue
                />
                <InfoRow
                  icon={<User2 className="h-4 w-4" />}
                  label="Username"
                  value={user.username ?? "—"}
                  breakValue
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone Number"
                  value={user.phone ?? "—"}
                />
                <InfoRow
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Created At"
                  value={formatDate(user.createdAt)}
                />
                <InfoRow
                  icon={<LogIn className="h-4 w-4" />}
                  label="Last Login"
                  value={formatDate(user.lastLoginAt)}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-950">
                  Organization Memberships
                </h3>
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600">
                  {user.memberships.length}
                </span>
              </div>

              {user.memberships.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-5 w-5" />}
                  title="No memberships"
                  description="This user is not attached to any organization membership."
                />
              ) : (
                <div className="space-y-3">
                  {user.memberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="break-words text-base font-semibold text-neutral-950">
                            {membership.org.name}
                          </h4>
                          <p className="mt-1 break-all text-sm text-neutral-500">
                            Slug: {membership.org.slug}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <MiniTag>{String(membership.role)}</MiniTag>
                          <MiniTag>{String(membership.scopeType)}</MiniTag>
                          <MiniTag>{String(membership.org.status)}</MiniTag>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <InfoRow
                          icon={<BadgeCheck className="h-4 w-4" />}
                          label="Membership Role"
                          value={String(membership.role)}
                        />
                        <InfoRow
                          icon={<Shield className="h-4 w-4" />}
                          label="Scope Type"
                          value={String(membership.scopeType)}
                        />
                        <InfoRow
                          icon={<CalendarDays className="h-4 w-4" />}
                          label="Membership Created"
                          value={formatDate(membership.createdAt)}
                        />
                        <InfoRow
                          icon={<Building2 className="h-4 w-4" />}
                          label="Organization Created"
                          value={formatDate(membership.org.createdAt)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-950">
                  Account Controls
                </h3>
              </div>

              <form action={updatePlatformUserStatus} className="space-y-3">
                <input type="hidden" name="userId" value={user.id} />
                <label className="block text-sm font-medium text-neutral-800">
                  Account status
                </label>
                <select
                  name="status"
                  defaultValue={user.status}
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  disabled={user.isRootSuperAdmin}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DISABLED">Disabled</option>
                </select>
                <button
                  type="submit"
                  disabled={user.isRootSuperAdmin}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Update status
                </button>
              </form>

              <div className="mt-5 border-t border-neutral-200 pt-5">
                <h4 className="text-sm font-semibold text-neutral-950">
                  Delete orphan user
                </h4>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  Available only for users with no organization memberships and
                  no platform permissions.
                </p>
                <form action={archiveOrphanPlatformUser} className="mt-3 space-y-3">
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    name="confirmation"
                    placeholder={`Type ${archiveConfirmation}`}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400 disabled:bg-neutral-100"
                    disabled={!isOrphanUser || user.isRootSuperAdmin}
                  />
                  <button
                    type="submit"
                    disabled={!isOrphanUser || user.isRootSuperAdmin}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete user
                  </button>
                </form>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <User2 className="h-5 w-5 text-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-950">
                  Edit User
                </h3>
              </div>

              <form action={updatePlatformUserProfile} className="space-y-3">
                <input type="hidden" name="userId" value={user.id} />
                <ControlField label="Full name">
                  <input
                    name="fullName"
                    defaultValue={user.fullName}
                    required
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </ControlField>
                <ControlField label="Username">
                  <input
                    name="username"
                    defaultValue={user.username ?? ""}
                    required
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </ControlField>
                <ControlField label="Email">
                  <input
                    name="email"
                    type="email"
                    defaultValue={user.email ?? ""}
                    required
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </ControlField>
                <ControlField label="Phone">
                  <input
                    name="phone"
                    defaultValue={user.phone ?? ""}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </ControlField>
                <ControlField label="System role">
                  <select
                    name="platformRole"
                    defaultValue={user.platformRole}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  >
                    {Object.values(PlatformRole).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </ControlField>
                <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                  <input
                    type="checkbox"
                    name="canCreatePlatformAdmins"
                    defaultChecked={user.canCreatePlatformAdmins}
                    className="mt-1 h-4 w-4 rounded border-neutral-300"
                  />
                  <span className="text-sm font-medium text-neutral-800">
                    Can create platform admins
                  </span>
                </label>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90">
                  <Save className="h-4 w-4" />
                  Save user
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-950">
                  Reset Password
                </h3>
              </div>
              <form action={resetPlatformUserPassword} className="space-y-3">
                <input type="hidden" name="userId" value={user.id} />
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Temporary password"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  required
                />
                <input
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  placeholder="Confirm temporary password"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
                  required
                />
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50">
                  <KeyRound className="h-4 w-4" />
                  Set temporary password
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-950">
                  Platform Permissions
                </h3>
              </div>

              {user.platformPermissions.length === 0 ? (
                <EmptyState
                  icon={<Shield className="h-5 w-5" />}
                  title="No explicit permissions"
                  description="This user does not currently have explicit platform permissions."
                />
              ) : (
                <div className="space-y-3">
                  {user.platformPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-neutral-950">
                            {permission.permission}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            Explicit platform permission
                          </p>
                        </div>

                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700">
                          {permission.granted ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Granted
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Revoked
                            </>
                          )}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-neutral-500">
                        Permission ID: {permission.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-950">
                  Edit Permissions
                </h3>
              </div>
              <form action={updatePlatformUserPermissions} className="space-y-3">
                <input type="hidden" name="userId" value={user.id} />
                <div className="grid gap-2">
                  {Object.values(PlatformPermissionType).map((permission) => (
                    <label
                      key={permission}
                      className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <input
                        type="checkbox"
                        name="permissions"
                        value={permission}
                        defaultChecked={grantedPermissionSet.has(permission)}
                        className="mt-1 h-4 w-4 rounded border-neutral-300"
                      />
                      <span className="text-sm font-medium text-neutral-800">
                        {permission}
                      </span>
                    </label>
                  ))}
                </div>
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90">
                  <Save className="h-4 w-4" />
                  Save permissions
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <User2 className="h-5 w-5 text-neutral-700" />
                <h3 className="text-lg font-semibold text-neutral-950">
                  Summary
                </h3>
              </div>

              <div className="space-y-3">
                <SummaryRow label="Full Name" value={user.fullName ?? "—"} />
                <SummaryRow label="Platform Role" value={String(user.platformRole)} />
                <SummaryRow label="Status" value={String(user.status)} />
                <SummaryRow
                  label="Root Super Admin"
                  value={user.isRootSuperAdmin ? "Yes" : "No"}
                />
                <SummaryRow
                  label="Can Create Platform Admins"
                  value={user.canCreatePlatformAdmins ? "Yes" : "No"}
                />
                <SummaryRow
                  label="Membership Count"
                  value={String(user.memberships.length)}
                />
                <SummaryRow
                  label="Permission Count"
                  value={String(user.platformPermissions.length)}
                />
                <SummaryRow
                  label="Granted Permissions"
                  value={String(grantedPermissions.length)}
                />
                <SummaryRow
                  label="Revoked Permissions"
                  value={String(revokedPermissions.length)}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
          {label}
        </p>
        <p className="text-base font-semibold text-neutral-950">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  breakValue = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  breakValue?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-neutral-500">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      <p
        className={`text-sm font-medium text-neutral-900 ${
          breakValue ? "break-all" : "break-words"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Tag({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
      {icon}
      {children}
    </span>
  );
}

function MiniTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700">
      {children}
    </span>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="max-w-[60%] break-words text-right text-sm font-medium text-neutral-900">
        {value}
      </span>
    </div>
  );
}

function ControlField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-800">
        {label}
      </span>
      {children}
    </label>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}
