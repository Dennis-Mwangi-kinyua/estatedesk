import Link from "next/link";
import { PlatformRole, Prisma, UserStatus } from "@prisma/client";
import {
  ArrowUpRight,
  Crown,
  Mail,
  Phone,
  Search,
  Shield,
  User2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPagination } from "@/lib/db/pagination";
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
}>;

const ROLE_VALUES = Object.values(PlatformRole);
const STATUS_VALUES = Object.values(UserStatus);

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

  const [users, totalFiltered, totalUsers, totalAdmins, activeUsers] =
    await Promise.all([
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
      prisma.user.count({ where }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: {
          deletedAt: null,
          platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
        },
      }),
      prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Identity directory"
        title="Platform users"
        description="Search and review users with server-side pagination, compact membership previews, and permission summaries."
      />

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
