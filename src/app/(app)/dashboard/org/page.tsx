import dynamic from "next/dynamic";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { getOrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { OrgDashboardHero } from "@/features/dashboard/components/org-dashboard-hero";
import { OrgDashboardMetrics } from "@/features/dashboard/components/org-dashboard-metrics";

const OrgDashboardPortfolio = dynamic(
  () =>
    import("@/features/dashboard/components/org-dashboard-portfolio").then(
      (m) => m.OrgDashboardPortfolio,
    ),
  {
    loading: () => (
      <div className="h-80 rounded-3xl border border-neutral-200 bg-white animate-pulse" />
    ),
  },
);

const OrgDashboardPayments = dynamic(
  () =>
    import("@/features/dashboard/components/org-dashboard-payments").then(
      (m) => m.OrgDashboardPayments,
    ),
  {
    loading: () => (
      <div className="h-72 rounded-3xl border border-neutral-200 bg-white animate-pulse" />
    ),
  },
);

const OrgDashboardSidebar = dynamic(
  () =>
    import("@/features/dashboard/components/org-dashboard-sidebar").then(
      (m) => m.OrgDashboardSidebar,
    ),
  {
    loading: () => (
      <div className="h-[38rem] rounded-3xl border border-neutral-200 bg-white animate-pulse" />
    ),
  },
);

const getCurrentOrgContext = cache(async function getCurrentOrgContext() {
  const session = await requireUserSession();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (membership) return membership;

  const fallbackMembership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (!fallbackMembership) redirect("/dashboard");

  return fallbackMembership;
});

export default async function OrganizationDashboardPage() {
  const membership = await getCurrentOrgContext();
  const data = await getOrgDashboardSummary(membership.orgId);

  return (
    <div className="space-y-6">
      <OrgDashboardHero data={data} />
      <OrgDashboardMetrics data={data} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <OrgDashboardPortfolio data={data} />
          <OrgDashboardPayments data={data} />
        </div>

        <div className="xl:col-span-4">
          <OrgDashboardSidebar data={data} membership={membership} />
        </div>
      </section>
    </div>
  );
}