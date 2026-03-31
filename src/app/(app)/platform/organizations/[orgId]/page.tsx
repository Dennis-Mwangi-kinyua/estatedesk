import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export default async function PlatformOrganizationsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [organizations, totalOrganizations, activeOrganizations, suspendedOrganizations] =
    await Promise.all([
      prisma.organization.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          subscription: {
            select: {
              id: true,
              plan: true,
              status: true,
              currentPeriodEnd: true,
            },
          },
        },
        take: 8,
      }),
      prisma.organization.count({
        where: {
          deletedAt: null,
        },
      }),
      prisma.organization.count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
      }),
      prisma.organization.count({
        where: {
          deletedAt: null,
          status: "SUSPENDED",
        },
      }),
    ]);

  const orgIds = organizations.map((org) => org.id);

  const [membershipCounts, propertyCounts, leaseCounts, tenantCounts, paymentCounts] =
    orgIds.length === 0
      ? [[], [], [], [], []]
      : await Promise.all([
          prisma.membership.groupBy({
            by: ["orgId"],
            where: {
              orgId: { in: orgIds },
            },
            _count: {
              orgId: true,
            },
          }),
          prisma.property.groupBy({
            by: ["orgId"],
            where: {
              orgId: { in: orgIds },
              deletedAt: null,
            },
            _count: {
              orgId: true,
            },
          }),
          prisma.lease.groupBy({
            by: ["orgId"],
            where: {
              orgId: { in: orgIds },
              deletedAt: null,
            },
            _count: {
              orgId: true,
            },
          }),
          prisma.tenant.groupBy({
            by: ["orgId"],
            where: {
              orgId: { in: orgIds },
              deletedAt: null,
            },
            _count: {
              orgId: true,
            },
          }),
          prisma.payment.groupBy({
            by: ["orgId"],
            where: {
              orgId: { in: orgIds },
            },
            _count: {
              orgId: true,
            },
          }),
        ]);

  const membershipCountMap = new Map(
    membershipCounts.map((item) => [item.orgId, item._count.orgId]),
  );
  const propertyCountMap = new Map(
    propertyCounts.map((item) => [item.orgId, item._count.orgId]),
  );
  const leaseCountMap = new Map(
    leaseCounts.map((item) => [item.orgId, item._count.orgId]),
  );
  const tenantCountMap = new Map(
    tenantCounts.map((item) => [item.orgId, item._count.orgId]),
  );
  const paymentCountMap = new Map(
    paymentCounts.map((item) => [item.orgId, item._count.orgId]),
  );

  return (
    <div className="h-[calc(100vh-7rem)] overflow-hidden">
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/platform" className="hover:underline">
                Platform
              </Link>
              <span>/</span>
              <span>Organizations</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                🏢 Organizations
              </h1>
              <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Platform Workspace Control
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Review organization workspaces, jump into billing and audits, and
              create new organizations from one clean control surface.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/platform/organizations/new"
              className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              ✨ Add New Organization
            </Link>
            <Link
              href="/platform/reports"
              className="inline-flex items-center rounded-xl border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted/30"
            >
              📈 Reports
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard title="🏢 Total" value={totalOrganizations} />
          <MetricCard title="✅ Active" value={activeOrganizations} />
          <MetricCard title="⛔ Suspended" value={suspendedOrganizations} />
          <MetricCard title="🗂 Showing" value={organizations.length} />
        </div>

        <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[0.95fr_1.35fr]">
          <section className="grid min-h-0 gap-4">
            <Card>
              <CardHeader
                title="⚡ Quick Actions"
                subtitle="Fast platform shortcuts"
              />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <ActionCard
                  href="/platform/organizations/new"
                  emoji="✨"
                  title="Add New Organization"
                  description="Create a workspace and its first admin account."
                />
                <ActionCard
                  href="/platform/users"
                  emoji="👥"
                  title="Platform Users"
                  description="Review users across the platform."
                />
                <ActionCard
                  href="/platform/billing"
                  emoji="💳"
                  title="Billing"
                  description="Track plans, renewals, and subscriptions."
                />
                <ActionCard
                  href="/platform/audit-logs"
                  emoji="🧾"
                  title="Audit Logs"
                  description="Inspect actions across the system."
                />
                <ActionCard
                  href="/platform/reports"
                  emoji="📊"
                  title="Reports"
                  description="See platform-wide operational metrics."
                />
                <ActionCard
                  href="/platform/admins"
                  emoji="🛡️"
                  title="Platform Admins"
                  description="Manage privileged platform access."
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                title="🌍 Workspace Snapshot"
                subtitle="High-level estate operations view"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniInfo
                  label="Default Currency Focus"
                  value="KES-centric"
                />
                <MiniInfo
                  label="Primary Timezone"
                  value="Africa/Nairobi"
                />
                <MiniInfo
                  label="Latest Management Style"
                  value="Multi-tenant RBAC"
                />
                <MiniInfo
                  label="Operations Mood"
                  value="Clean • Fast • Controlled"
                />
              </div>
            </Card>
          </section>

          <Card className="min-h-0 overflow-hidden">
            <CardHeader
              title="📁 Organizations Directory"
              subtitle="Recent and active organization workspaces"
            />

            {organizations.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-sm text-muted-foreground">
                No organizations found yet.
              </div>
            ) : (
              <div className="grid h-[calc(100%-3.5rem)] min-h-0 gap-3 overflow-y-auto pr-1">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="rounded-2xl border bg-muted/10 p-4 transition hover:bg-muted/20"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/platform/organizations/${org.id}`}
                            className="truncate text-base font-semibold underline underline-offset-4"
                          >
                            {org.name}
                          </Link>
                          <Badge>{org.status}</Badge>
                          <Badge>{org.currencyCode}</Badge>
                          <Badge>{org.timezone}</Badge>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <p>Slug: {org.slug}</p>
                          <p>Email: {org.email ?? "—"}</p>
                          <p>Phone: {org.phone ?? "—"}</p>
                          <p>Created: {formatDate(org.createdAt)}</p>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                          <MiniStat
                            label="👥 Staff"
                            value={membershipCountMap.get(org.id) ?? 0}
                          />
                          <MiniStat
                            label="🏘 Properties"
                            value={propertyCountMap.get(org.id) ?? 0}
                          />
                          <MiniStat
                            label="📄 Leases"
                            value={leaseCountMap.get(org.id) ?? 0}
                          />
                          <MiniStat
                            label="🧍 Tenants"
                            value={tenantCountMap.get(org.id) ?? 0}
                          />
                          <MiniStat
                            label="💰 Payments"
                            value={paymentCountMap.get(org.id) ?? 0}
                          />
                        </div>

                        <div className="mt-4 rounded-xl border bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            💼 Subscription
                          </p>
                          {org.subscription ? (
                            <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                              <p>Plan: {org.subscription.plan}</p>
                              <p>Status: {org.subscription.status}</p>
                              <p>
                                Period End:{" "}
                                {formatDate(org.subscription.currentPeriodEnd)}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                              No subscription found.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={`/platform/organizations/${org.id}`}
                          className="rounded-xl border bg-white px-3 py-2 text-sm font-medium transition hover:bg-muted/30"
                        >
                          🔍 View
                        </Link>
                        <Link
                          href="/platform/billing"
                          className="rounded-xl border bg-white px-3 py-2 text-sm font-medium transition hover:bg-muted/30"
                        >
                          💳 Billing
                        </Link>
                        <Link
                          href="/platform/audit-logs"
                          className="rounded-xl border bg-white px-3 py-2 text-sm font-medium transition hover:bg-muted/30"
                        >
                          🧾 Audit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

function ActionCard({
  href,
  emoji,
  title,
  description,
}: {
  href: string;
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-muted/10 p-4 transition hover:bg-muted/20"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-white text-lg">
          {emoji}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/10 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
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