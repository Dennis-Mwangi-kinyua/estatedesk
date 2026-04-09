import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  LogIn,
  Mail,
  Phone,
  Shield,
  User2,
  Users,
  XCircle,
  Crown,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function getInitials(name: string | null | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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

  const totalAdmins = users.filter(
    (user) =>
      user.platformRole === "SUPER_ADMIN" ||
      user.platformRole === "PLATFORM_ADMIN"
  ).length;

  const activeUsers = users.filter((user) => user.status === "ACTIVE").length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-neutral-200 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
              Platform
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              Platform Users
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              View all users, platform roles, permissions, and organization memberships.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard
              label="Total Users"
              value={users.length}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              label="Admins"
              value={totalAdmins}
              icon={<Shield className="h-4 w-4" />}
            />
            <MetricCard
              label="Active"
              value={activeUsers}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        {users.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-neutral-50">
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
                <Users className="h-6 w-6 text-neutral-700" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">No users found</h2>
              <p className="mt-1 text-sm text-neutral-500">
                There are currently no active platform users to display.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-auto pr-1 xl:grid-cols-2 2xl:grid-cols-3">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/platform/users/${user.id}`}
                className="group flex min-h-[440px] flex-col rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-900 sm:h-14 sm:w-14">
                      {getInitials(user.fullName)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-base font-semibold text-neutral-950 sm:text-lg">
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
                    </div>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 transition group-hover:bg-neutral-100">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
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

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={user.email ?? "—"}
                    breakValue
                  />
                  <InfoRow
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone"
                    value={user.phone ?? "—"}
                  />
                  <InfoRow
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="Created"
                    value={formatDate(user.createdAt)}
                  />
                  <InfoRow
                    icon={<LogIn className="h-4 w-4" />}
                    label="Last login"
                    value={formatDate(user.lastLoginAt)}
                  />
                </div>

                <section className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-neutral-700" />
                    <h3 className="text-sm font-semibold text-neutral-900">Memberships</h3>
                    <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] text-neutral-600">
                      {user.memberships.length}
                    </span>
                  </div>

                  {user.memberships.length === 0 ? (
                    <p className="text-sm text-neutral-500">No memberships.</p>
                  ) : (
                    <div className="space-y-2">
                      {user.memberships.slice(0, 4).map((membership) => (
                        <div
                          key={membership.id}
                          className="rounded-2xl border border-neutral-200 bg-white p-3"
                        >
                          <p className="break-words text-sm font-medium text-neutral-900">
                            {membership.org.name}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                            <span>Role: {membership.role}</span>
                            <span>•</span>
                            <span>Scope: {membership.scopeType}</span>
                            <span>•</span>
                            <span>Slug: {membership.org.slug}</span>
                          </div>
                        </div>
                      ))}
                      {user.memberships.length > 4 && (
                        <p className="text-xs font-medium text-neutral-500">
                          +{user.memberships.length - 4} more memberships
                        </p>
                      )}
                    </div>
                  )}
                </section>

                <section className="mt-4 flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-neutral-700" />
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Platform Permissions
                    </h3>
                    <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] text-neutral-600">
                      {user.platformPermissions.length}
                    </span>
                  </div>

                  {user.platformPermissions.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      No explicit platform permissions.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {user.platformPermissions.slice(0, 4).map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3"
                        >
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-neutral-900">
                              {permission.permission}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              Explicit platform permission
                            </p>
                          </div>

                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700">
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
                      ))}
                      {user.platformPermissions.length > 4 && (
                        <p className="text-xs font-medium text-neutral-500">
                          +{user.platformPermissions.length - 4} more permissions
                        </p>
                      )}
                    </div>
                  )}
                </section>
              </Link>
            ))}
          </div>
        )}
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