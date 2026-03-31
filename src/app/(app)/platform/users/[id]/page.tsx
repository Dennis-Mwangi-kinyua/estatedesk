import Link from "next/link";
import { notFound } from "next/navigation";
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
  Shield,
  User2,
  Users,
  XCircle,
} from "lucide-react";

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

type PlatformUserDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlatformUserDetailsPage({
  params,
}: PlatformUserDetailsPageProps) {
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: {
      id,
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