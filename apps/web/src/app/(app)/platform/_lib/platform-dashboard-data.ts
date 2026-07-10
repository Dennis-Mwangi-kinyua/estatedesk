import { prisma } from "@/lib/prisma";
import { countOnlineUsers } from "@/lib/auth/presence";
import { buildBars, addMonths, startOfMonth } from "./helpers";
import {
  getOrganizationSeries,
  getRevenueSeries,
  platformQuery,
} from "./series-queries";

export async function getPlatformDashboardData() {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = addMonths(currentMonthStart, -1);
  const nextMonthStart = addMonths(currentMonthStart, 1);

  const [
    totalUsers,
    onlineUsers,
    totalRootAdmins,
    totalPlatformAdmins,
    totalOrganizations,
    totalProperties,
    totalUnits,
    totalTenants,
    totalLeases,
    totalSubscriptions,
    totalPayments,
    totalAuditLogs,
    currentMonthOrgCount,
    previousMonthOrgCount,
    currentRevenueAgg,
    previousRevenueAgg,
    verifiedPayments,
    pendingPayments,
    failedPayments,
    activeSubscriptions,
    trialSubscriptions,
    atRiskSubscriptions,
    recentOrganizations,
    recentPayments,
    newOnboardingCount,
    recentOnboardingRequests,
    organizationSeries,
    revenueSeries,
  ] = await Promise.all([
    platformQuery("platform-total-users", () =>
      prisma.user.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-online-users", () => countOnlineUsers(now)),
    platformQuery("platform-root-admins", () =>
      prisma.user.count({
        where: {
          deletedAt: null,
          isRootSuperAdmin: true,
        },
      }),
    ),
    platformQuery("platform-admins", () =>
      prisma.user.count({
        where: {
          deletedAt: null,
          OR: [{ platformRole: "SUPER_ADMIN" }, { platformRole: "PLATFORM_ADMIN" }],
        },
      }),
    ),
    platformQuery("platform-total-organizations", () =>
      prisma.organization.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-properties", () =>
      prisma.property.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-units", () =>
      prisma.unit.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-tenants", () =>
      prisma.tenant.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-leases", () =>
      prisma.lease.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-subscriptions", () => prisma.subscription.count()),
    platformQuery("platform-total-payments", () => prisma.payment.count()),
    platformQuery("platform-total-audit-logs", () => prisma.auditLog.count()),

    platformQuery("platform-current-month-orgs", () =>
      prisma.organization.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: currentMonthStart,
            lt: nextMonthStart,
          },
        },
      }),
    ),
    platformQuery("platform-previous-month-orgs", () =>
      prisma.organization.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: previousMonthStart,
            lt: currentMonthStart,
          },
        },
      }),
    ),

    platformQuery("platform-current-revenue", () =>
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paidAt: {
            gte: currentMonthStart,
            lt: nextMonthStart,
          },
          verificationStatus: "VERIFIED",
        },
      }),
    ),
    platformQuery("platform-previous-revenue", () =>
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paidAt: {
            gte: previousMonthStart,
            lt: currentMonthStart,
          },
          verificationStatus: "VERIFIED",
        },
      }),
    ),

    platformQuery("platform-verified-payments", () =>
      prisma.payment.count({
        where: { verificationStatus: "VERIFIED" },
      }),
    ),
    platformQuery("platform-pending-payments", () =>
      prisma.payment.count({
        where: { verificationStatus: "PENDING" },
      }),
    ),
    platformQuery("platform-failed-payments", () =>
      prisma.payment.count({
        where: { gatewayStatus: "FAILED" },
      }),
    ),

    platformQuery("platform-active-subscriptions", () =>
      prisma.subscription.count({
        where: { status: "ACTIVE" },
      }),
    ),
    platformQuery("platform-trial-subscriptions", () =>
      prisma.subscription.count({
        where: { status: "TRIALING" },
      }),
    ),
    platformQuery("platform-at-risk-subscriptions", () =>
      prisma.subscription.count({
        where: {
          status: { in: ["EXPIRED", "CANCELLED", "PAST_DUE"] },
        },
      }),
    ),

    platformQuery("platform-recent-organizations", () =>
      prisma.organization.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          subscription: {
            select: {
              plan: true,
              status: true,
              currentPeriodEnd: true,
              trialEndsAt: true,
            },
          },
          _count: {
            select: {
              properties: true,
              tenants: true,
              leases: true,
              payments: true,
              memberships: true,
            },
          },
        },
      }),
    ),

    platformQuery("platform-recent-payments", () =>
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          org: { select: { name: true } },
          payerTenant: { select: { fullName: true } },
        },
      }),
    ),

    platformQuery("platform-new-onboarding-count", () =>
      prisma.onboardingRequest.count({ where: { status: "NEW" } }),
    ),

    platformQuery("platform-recent-onboarding", () =>
      prisma.onboardingRequest.findMany({
        where: { status: "NEW" },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          marketer: { select: { fullName: true, referralCode: true } },
        },
      }),
    ),

    getOrganizationSeries(6),
    getRevenueSeries(6),
  ]);

  const currentRevenue = Number(currentRevenueAgg._sum.amount ?? 0);
  const previousRevenue = Number(previousRevenueAgg._sum.amount ?? 0);

  return {
    totalUsers,
    onlineUsers,
    totalRootAdmins,
    totalPlatformAdmins,
    totalOrganizations,
    totalProperties,
    totalUnits,
    totalTenants,
    totalLeases,
    totalSubscriptions,
    totalPayments,
    totalAuditLogs,
    currentMonthOrgCount,
    previousMonthOrgCount,
    currentRevenue,
    previousRevenue,
    verifiedPayments,
    pendingPayments,
    failedPayments,
    activeSubscriptions,
    trialSubscriptions,
    atRiskSubscriptions,
    recentOrganizations,
    recentPayments,
    newOnboardingCount,
    recentOnboardingRequests,
    organizationSeries,
    revenueSeries,
    organizationBars: buildBars(organizationSeries.map((item) => item.value)),
    revenueBars: buildBars(revenueSeries.map((item) => item.value)),
  };
}

export type PlatformDashboardData = Awaited<
  ReturnType<typeof getPlatformDashboardData>
>;