import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const [
    totalUsers,
    totalOrganizations,
    totalAdmins,
    totalSubscriptions,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: {
        deletedAt: null,
        OR: [
          { platformRole: "PLATFORM_ADMIN" },
          { platformRole: "SUPER_ADMIN" },
          { isRootSuperAdmin: true },
        ],
      },
    }),
    prisma.subscription.count(),
    prisma.auditLog.count(),
  ]);

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Platform</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Platform-wide administration, monitoring, and control center.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card title="Users" value={totalUsers} />
        <Card title="Organizations" value={totalOrganizations} />
        <Card title="Admins" value={totalAdmins} />
        <Card title="Subscriptions" value={totalSubscriptions} />
        <Card title="Audit Logs" value={recentAuditLogs} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <QuickLink
          href="/platform/admins"
          title="Admins"
          description="Manage platform admins and permissions."
        />
        <QuickLink
          href="/platform/users"
          title="Users"
          description="Review all users across the platform."
        />
        <QuickLink
          href="/platform/organizations"
          title="Organizations"
          description="View tenants, plans, and org status."
        />
        <QuickLink
          href="/platform/billing"
          title="Billing"
          description="Track subscriptions and plan changes."
        />
        <QuickLink
          href="/platform/audit-logs"
          title="Audit Logs"
          description="Inspect actions taken across the system."
        />
        <QuickLink
          href="/platform/reports"
          title="Reports"
          description="See high-level platform metrics."
        />
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-background p-5 shadow-sm transition hover:bg-muted/30"
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}