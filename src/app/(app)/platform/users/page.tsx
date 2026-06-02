import Link from "next/link";
import {
  PlatformPermissionType,
  PlatformRole,
  Prisma,
  UserStatus,
} from "@prisma/client";
import {
  ArrowUpRight,
  Crown,
  KeyRound,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  User2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPagination } from "@/lib/db/pagination";
import { createPlatformUserAction } from "./actions";
import {
  Badge,
  PageHeader,
  PaginationControls,
  StatCard,
  formatDateTime,
  formatNumber,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  role?: string;
  status?: string;
  created?: string;
  createError?: string;
  archived?: string;
}>;

const ROLE_VALUES = Object.values(PlatformRole);
const STATUS_VALUES = Object.values(UserStatus);
const PLATFORM_PERMISSION_VALUES = Object.values(PlatformPermissionType);

const PLATFORM_ROLE_META = {
  USER: {
    title: "Platform User",
    description:
      "Standard account. Access depends on organization membership or tenant/landlord mapping.",
  },
  PLATFORM_ADMIN: {
    title: "Platform Admin",
    description:
      "Can operate the control plane according to granted platform permissions.",
  },
  SUPER_ADMIN: {
    title: "Super Admin",
    description:
      "Highest platform role. Use for trusted system owners only.",
  },
} satisfies Record<PlatformRole, { title: string; description: string }>;

const CREATE_ERROR_MESSAGES: Record<string, string> = {
  missing: "Full name, username, and email are required.",
  username: "Username must be 3-30 characters using letters, numbers, dots, underscores, or hyphens.",
  password: "Password must be at least 8 characters and both password fields must match.",
  duplicate: "A user with the same username, email, or phone already exists.",
  "super-admin": "Only a super admin can create another super admin.",
};

function getInitials(name: string | null | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.slice(0, 1).toUpperCase() ?? "U";
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function parseRole(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return ROLE_VALUES.find((role) => role === normalized) ?? null;
}

function parseStatus(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return STATUS_VALUES.find((status) => status === normalized) ?? null;
}

function formatPermission(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildWhere({
  q,
  role,
  status,
}: {
  q: string;
  role: PlatformRole | null;
  status: UserStatus | null;
}): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (role) where.platformRole = role;
  if (status) where.status = status;

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const role = parseRole(params.role);
  const status = parseStatus(params.status);
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 24),
  });
  const where = buildWhere({ q, role, status });

  const users = await retryTransientDatabaseOperation(
    () =>
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          username: true,
          status: true,
          platformRole: true,
          canCreatePlatformAdmins: true,
          isRootSuperAdmin: true,
          createdAt: true,
          lastLoginAt: true,
          platformPermissions: {
            orderBy: { permission: "asc" },
            take: 6,
            select: {
              id: true,
              permission: true,
              granted: true,
            },
          },
          memberships: {
            orderBy: { createdAt: "desc" },
            take: 4,
            select: {
              id: true,
              role: true,
              scopeType: true,
              org: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: {
            select: {
              memberships: true,
              platformPermissions: true,
            },
          },
        },
      }),
    { label: "platform-users-findMany", attempts: 3, delayMs: 400 },
  );

  const totalFiltered = await retryTransientDatabaseOperation(
    () => prisma.user.count({ where }),
    { label: "platform-users-count-filtered", attempts: 3, delayMs: 300 },
  );

  const totalUsers = await retryTransientDatabaseOperation(
    () => prisma.user.count({ where: { deletedAt: null } }),
    { label: "platform-users-count-total", attempts: 3, delayMs: 300 },
  );

  const totalAdmins = await retryTransientDatabaseOperation(
    () =>
      prisma.user.count({
        where: {
          deletedAt: null,
          platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
        },
      }),
    { label: "platform-users-count-admins", attempts: 3, delayMs: 300 },
  );

  const activeUsers = await retryTransientDatabaseOperation(
    () => prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    { label: "platform-users-count-active", attempts: 3, delayMs: 300 },
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Identity directory"
        title="Platform users"
        description="Create platform users, assign system roles, review memberships, and clean up orphan accounts from one control surface."
      />

      {params.created ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Platform user created. They will reset their password and accept the
          terms on first sign-in.
        </div>
      ) : null}

      {params.createError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {CREATE_ERROR_MESSAGES[params.createError] ??
            "Could not create this platform user."}
        </div>
      ) : null}

      {params.archived ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Deleted orphan user: {params.archived}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        {ROLE_VALUES.map((roleValue) => (
          <RoleCard
            key={roleValue}
            role={roleValue}
            title={PLATFORM_ROLE_META[roleValue].title}
            description={PLATFORM_ROLE_META[roleValue].description}
          />
        ))}
      </section>

      <CreatePlatformUserPanel />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={formatNumber(totalUsers)} />
        <StatCard label="Admins" value={formatNumber(totalAdmins)} />
        <StatCard label="Active" value={formatNumber(activeUsers)} />
        <StatCard label="Matching" value={formatNumber(totalFiltered)} />
      </section>

      <section className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm">
        <form className="grid gap-3 border-b border-neutral-200 p-4 lg:grid-cols-[1fr_180px_180px_auto]">
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, username, or phone"
              className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
            />
          </div>

          <select
            name="role"
            defaultValue={role ?? ""}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 outline-none"
          >
            <option value="">All roles</option>
            {ROLE_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 outline-none"
          >
            <option value="">All statuses</option>
            {STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <button className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800">
            Apply
          </button>
        </form>

        {users.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            No users match the current filters.
          </div>
        ) : (
          <div className="grid gap-3 p-3 sm:p-4 xl:grid-cols-2">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/platform/users/${user.id}`}
                className="group rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-950">
                      {getInitials(user.fullName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-neutral-950">
                          {user.fullName}
                        </h2>
                        {user.isRootSuperAdmin ? (
                          <Badge>
                            <span className="inline-flex items-center gap-1">
                              <Crown className="h-3.5 w-3.5" />
                              Root
                            </span>
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {user.email ?? user.username ?? "No email"}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-neutral-700" />
                </div>

                <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    System role
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-950">
                    {PLATFORM_ROLE_META[user.platformRole].title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-neutral-600">
                    {PLATFORM_ROLE_META[user.platformRole].description}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={toneForStatus(user.platformRole)}>
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      {user.platformRole}
                    </span>
                  </Badge>
                  <Badge tone={toneForStatus(user.status)}>
                    <span className="inline-flex items-center gap-1">
                      <User2 className="h-3.5 w-3.5" />
                      {user.status}
                    </span>
                  </Badge>
                  {user.canCreatePlatformAdmins ? <Badge>Can create admins</Badge> : null}
                  {user._count.memberships === 0 &&
                  user._count.platformPermissions === 0 ? (
                    <Badge>
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                        Deletable orphan
                      </span>
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <InfoPill icon={<Mail className="h-4 w-4" />} label="Email" value={user.email ?? "-"} />
                  <InfoPill icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone ?? "-"} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <PreviewBlock
                    title="Memberships"
                    count={user._count.memberships}
                    items={user.memberships.map((membership) => ({
                      id: membership.id,
                      title: membership.org.name,
                      detail: `${membership.role} • ${membership.scopeType}`,
                    }))}
                  />
                  <PreviewBlock
                    title="Permissions"
                    count={user._count.platformPermissions}
                    items={user.platformPermissions.map((permission) => ({
                      id: permission.id,
                      title: permission.permission,
                      detail: permission.granted ? "Granted" : "Revoked",
                    }))}
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-neutral-500">
                  <span>Created {formatDateTime(user.createdAt)}</span>
                  <span>Last login {formatDateTime(user.lastLoginAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={totalFiltered}
          basePath="/platform/users"
          query={{ q, role, status }}
        />
      </section>
    </div>
  );
}

function RoleCard({
  role,
  title,
  description,
}: {
  role: PlatformRole;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {role}
          </p>
          <h2 className="mt-2 text-base font-semibold text-neutral-950">
            {title}
          </h2>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-2">
          {role === "SUPER_ADMIN" ? (
            <Crown className="h-4 w-4 text-neutral-700" />
          ) : role === "PLATFORM_ADMIN" ? (
            <Shield className="h-4 w-4 text-neutral-700" />
          ) : (
            <User2 className="h-4 w-4 text-neutral-700" />
          )}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  );
}

function CreatePlatformUserPanel() {
  return (
    <section className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm">
      <details>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-neutral-200 p-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-950">
              Add platform user
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Create standard users, platform admins, or super admins with clear
              permissions.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            Add user
          </span>
        </summary>

        <form action={createPlatformUserAction} className="grid gap-5 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input
                name="fullName"
                required
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="Jane Admin"
              />
            </Field>
            <Field label="Username">
              <input
                name="username"
                required
                minLength={3}
                maxLength={30}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="jane.admin"
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="jane@example.com"
              />
            </Field>
            <Field label="Phone">
              <input
                name="phone"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="+254700000000"
              />
            </Field>
            <Field label="Temporary password">
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              />
            </Field>
            <Field label="Confirm password">
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              />
            </Field>
            <Field label="System role">
              <select
                name="platformRole"
                defaultValue={PlatformRole.USER}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              >
                {ROLE_VALUES.map((role) => (
                  <option key={role} value={role}>
                    {PLATFORM_ROLE_META[role].title}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <input
                type="checkbox"
                name="canCreatePlatformAdmins"
                className="mt-1 h-4 w-4 rounded border-neutral-300"
              />
              <span>
                <span className="block text-sm font-semibold text-neutral-950">
                  Can create platform admins
                </span>
                <span className="mt-1 block text-xs leading-5 text-neutral-600">
                  Allows this account to create other control-plane admins.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-neutral-600" />
              <h3 className="text-sm font-semibold text-neutral-950">
                Platform permissions
              </h3>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {PLATFORM_PERMISSION_VALUES.map((permission) => (
                <label
                  key={permission}
                  className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-3"
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={permission}
                    className="mt-1 h-4 w-4 rounded border-neutral-300"
                  />
                  <span className="text-sm font-medium text-neutral-800">
                    {formatPermission(permission)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 md:w-fit">
            <Plus className="h-4 w-4" />
            Create platform user
          </button>
        </form>
      </details>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center gap-2 text-neutral-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-2 break-all text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function PreviewBlock({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: Array<{ id: string; title: string; detail: string }>;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-950">{title}</p>
        <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-600">
          {count}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">None</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-2">
              <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
              <p className="mt-1 truncate text-xs text-neutral-500">{item.detail}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
