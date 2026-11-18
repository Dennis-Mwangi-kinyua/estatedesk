import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { countOnlineUsersForOrg } from "@/lib/auth/presence";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { PENDING_REVIEW_STATUSES } from "@/features/accounting-requests/_lib/constants";
import { countUnpostedPayments } from "@/lib/accounting/unposted-payments";

export type OrgDashboardActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  createdAt: string;
};

export type OrgDashboardSummary = {
  totalProperties: number;
  totalBuildings: number;
  totalUnits: number;
  totalApartments: number;
  occupiedUnits: number;
  vacantUnits: number;
  activeTenants: number;
  totalTenants: number;
  activeLeases: number;
  totalEmployees: number;
  onlineUsers: number;
  totalCaretakers: number;
  activeCaretakerAssignments: number;
  openIssues: number;
  urgentIssues: number;
  pendingResolutionReports: number;
  unreadNotifications: number;
  totalPayments: number;
  pendingPayments: number;
  mpesaPayments: number;
  mpesaSuccessfulPayments: number;
  mpesaPendingPayments: number;
  occupancyRate: number;
  vacancyRate: number;
  issuePressure: number;
  apartmentMix: number;
  pendingFinanceRequests: number;
  accountingInitialized: boolean;
  openPayables: number;
  waterPendingApproval: number;
  moveOutQueueCount: number;
  leaseExpiring30Days: number;
  leaseExpiring60Days: number;
  expenditureApprovalsPending: number;
  pendingTaxCharges: number;
  scheduledInspections: number;
  overdueInspections: number;
  vacancyInquiries: number;
  unpostedPayments: number;
  approvedExpendituresAwaitingPayment: number;
  recentActivity: OrgDashboardActivityItem[];
};

export async function getOrgDashboardSummary(
  orgId: string,
): Promise<OrgDashboardSummary> {
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const in60Days = new Date(now);
  in60Days.setDate(in60Days.getDate() + 60);

  const [
    totalProperties,
    totalBuildings,
    unitGroups,
    tenantGroups,
    activeLeases,
    onlineUsers,
    membershipGroups,
    activeCaretakerAssignments,
    issueGroups,
    pendingResolutionReports,
    unreadNotifications,
    paymentMethodGroups,
    pendingFinanceRequests,
    accountingAccountCount,
    openPayables,
    waterPendingApproval,
    moveOutQueueCount,
    leaseExpiring30Days,
    leaseExpiring60Days,
    expenditureApprovalsPending,
    pendingTaxCharges,
    scheduledInspections,
    overdueInspections,
    vacancyInquiries,
    approvedExpendituresAwaitingPayment,
    unpostedPayments,
  ] = await retryTransientDatabaseOperation(
    () =>
      Promise.all([
    prisma.property.count({
      where: {
        orgId,
        deletedAt: null,
        isActive: true,
      },
    }),

    prisma.building.count({
      where: {
        deletedAt: null,
        isActive: true,
        property: {
          orgId,
          deletedAt: null,
        },
      },
    }),

    prisma.unit.groupBy({
      by: ["status", "type"],
      where: {
        deletedAt: null,
        isActive: true,
        property: {
          orgId,
          deletedAt: null,
        },
      },
      _count: {
        _all: true,
      },
    }),

    prisma.tenant.groupBy({
      by: ["status"],
      where: {
        orgId,
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.lease.count({
      where: {
        orgId,
        deletedAt: null,
        status: "ACTIVE",
      },
    }),

    countOnlineUsersForOrg(orgId),

    prisma.membership.groupBy({
      by: ["role"],
      where: {
        orgId,
        user: {
          deletedAt: null,
        },
      },
      _count: {
        _all: true,
      },
    }),

    prisma.caretakerAssignment.count({
      where: {
        orgId,
        active: true,
      },
    }),

    prisma.issueTicket.groupBy({
      by: ["priority", "status"],
      where: {
        orgId,
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
      _count: {
        _all: true,
      },
    }),

    prisma.issueResolutionReport.count({
      where: {
        orgId,
        status: "SUBMITTED",
      },
    }),

    prisma.notification.count({
      where: {
        orgId,
        readAt: null,
      },
    }),

    prisma.payment.groupBy({
      by: ["method", "gatewayStatus", "verificationStatus"],
      where: {
        orgId,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.accountingRequest.count({
      where: {
        orgId,
        status: { in: PENDING_REVIEW_STATUSES },
      },
    }),

    prisma.accountingAccount.count({
      where: { orgId, isActive: true },
    }),

    prisma.accountingVendorBill.count({
      where: {
        orgId,
        status: { in: ["APPROVED", "PARTIAL"] },
      },
    }),

    prisma.meterReading.count({
      where: {
        status: "SUBMITTED",
        unit: {
          property: {
            orgId,
            deletedAt: null,
          },
        },
      },
    }),

    prisma.moveOutNotice.count({
      where: {
        lease: { orgId },
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
    }),

    prisma.lease.count({
      where: {
        orgId,
        deletedAt: null,
        status: "ACTIVE",
        endDate: {
          gte: now,
          lte: in30Days,
        },
      },
    }),

    prisma.lease.count({
      where: {
        orgId,
        deletedAt: null,
        status: "ACTIVE",
        endDate: {
          gt: in30Days,
          lte: in60Days,
        },
      },
    }),

    prisma.expenditure.count({
      where: {
        orgId,
        status: "PENDING_APPROVAL",
      },
    }),

    prisma.taxCharge.count({
      where: {
        orgId,
        status: "PENDING",
      },
    }),

    prisma.inspection.count({
      where: {
        status: "SCHEDULED",
        notice: {
          lease: { orgId },
        },
      },
    }),

    prisma.inspection.count({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lt: now },
        notice: {
          lease: { orgId },
        },
      },
    }),

    prisma.vacancyInquiry.count({
      where: {
        orgId,
        status: "NEW",
      },
    }),

    prisma.expenditure.count({
      where: {
        orgId,
        status: "APPROVED",
      },
    }),

    countUnpostedPayments(prisma, orgId),

      ]),
    { label: "org-dashboard-summary" },
  );

  const totalUnits = unitGroups.reduce((sum, item) => sum + item._count._all, 0);

  const totalApartments = unitGroups
    .filter((item) => item.type === "APARTMENT")
    .reduce((sum, item) => sum + item._count._all, 0);

  const occupiedUnits = unitGroups
    .filter((item) => item.status === "OCCUPIED")
    .reduce((sum, item) => sum + item._count._all, 0);

  const vacantUnits = unitGroups
    .filter((item) => item.status === "VACANT")
    .reduce((sum, item) => sum + item._count._all, 0);

  const totalTenants = tenantGroups.reduce((sum, item) => sum + item._count._all, 0);

  const activeTenants =
    tenantGroups.find((item) => item.status === "ACTIVE")?._count._all ?? 0;

  const totalEmployees = membershipGroups
    .filter((item) =>
      ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(item.role),
    )
    .reduce((sum, item) => sum + item._count._all, 0);

  const totalCaretakers =
    membershipGroups.find((item) => item.role === "CARETAKER")?._count._all ?? 0;

  const openIssues = issueGroups.reduce((sum, item) => sum + item._count._all, 0);

  const urgentIssues = issueGroups
    .filter((item) => item.priority === "URGENT")
    .reduce((sum, item) => sum + item._count._all, 0);

  let totalPayments = 0;
  let pendingPayments = 0;
  let mpesaPayments = 0;
  let mpesaSuccessfulPayments = 0;
  let mpesaPendingPayments = 0;
  for (const group of paymentMethodGroups) {
    const count = group._count._all;
    const pending = group.gatewayStatus === "INITIATED" || group.gatewayStatus === "PENDING"
      || (group.gatewayStatus === "SUCCESS" && group.verificationStatus === "PENDING");
    totalPayments += count;
    if (pending) pendingPayments += count;
    if (group.method === "MPESA_STK") {
      mpesaPayments += count;
      if (group.gatewayStatus === "SUCCESS") mpesaSuccessfulPayments += count;
      if (pending) mpesaPendingPayments += count;
    }
  }

  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const vacancyRate =
    totalUnits > 0 ? Math.round((vacantUnits / totalUnits) * 100) : 0;

  const issuePressure =
    openIssues > 0 ? Math.round((urgentIssues / openIssues) * 100) : 0;

  const apartmentMix =
    totalUnits > 0 ? Math.round((totalApartments / totalUnits) * 100) : 0;

  const recentActivity: OrgDashboardActivityItem[] = [];

  return {
    totalProperties,
    totalBuildings,
    totalUnits,
    totalApartments,
    occupiedUnits,
    vacantUnits,
    activeTenants,
    totalTenants,
    activeLeases,
    totalEmployees,
    onlineUsers,
    totalCaretakers,
    activeCaretakerAssignments,
    openIssues,
    urgentIssues,
    pendingResolutionReports,
    unreadNotifications,
    totalPayments,
    pendingPayments,
    mpesaPayments,
    mpesaSuccessfulPayments,
    mpesaPendingPayments,
    occupancyRate,
    vacancyRate,
    issuePressure,
    apartmentMix,
    pendingFinanceRequests,
    accountingInitialized: accountingAccountCount > 0,
    openPayables,
    waterPendingApproval,
    moveOutQueueCount,
    leaseExpiring30Days,
    leaseExpiring60Days,
    expenditureApprovalsPending,
    pendingTaxCharges,
    scheduledInspections,
    overdueInspections,
    vacancyInquiries,
    unpostedPayments,
    approvedExpendituresAwaitingPayment,
    recentActivity,
  };
}

export function getCachedOrgDashboardSummary(orgId: string) {
  return unstable_cache(
    () => getOrgDashboardSummary(orgId),
    ["org-dashboard-summary-no-audit-v2", orgId],
    {
      revalidate: 15,
      tags: [`org-dashboard-summary:${orgId}`],
    },
  )();
}
