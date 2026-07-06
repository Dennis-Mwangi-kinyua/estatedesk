import Link from "next/link";
import { PlatformPermissionType, PlatformRole } from "@prisma/client";
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
} from "../actions";
import { formatDate, getInitials } from "../_lib/helpers";
import type { getPlatformUserDetails } from "../_lib/queries";
import {
  ControlField,
  EmptyState,
  InfoRow,
  MetricCard,
  MiniTag,
  SummaryRow,
  Tag,
} from "./user-detail-ui";

export type UserDetailWorkspaceProps = {
  details: Awaited<ReturnType<typeof getPlatformUserDetails>>;
  notice: ReturnType<typeof import("../_lib/helpers").getNotice>;
};


export function UserDetailProfile({ details, notice }: UserDetailWorkspaceProps) {
  const { user, grantedPermissions, revokedPermissions, isOrphanUser, archiveConfirmation, grantedPermissionSet } = details;

  return (
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
  );
}
