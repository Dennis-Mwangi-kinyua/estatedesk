import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

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
  totalCaretakers: number;
  activeCaretakerAssignments: number;
  openIssues: number;
  urgentIssues: number;
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
};

export const getOrgDashboardSummary = unstable_cache(
  async (orgId: string): Promise<OrgDashboardSummary> => {
    const [
      totalProperties,
      totalBuildings,
      unitGroups,
      tenantGroups,
      activeLeases,
      membershipGroups,
      activeCaretakerAssignments,
      issueGroups,
      unreadNotifications,
      totalPayments,
      paymentMethodGroups,
      pendingPayments,
    ] = await Promise.all([
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

      prisma.notification.count({
        where: {
          orgId,
          readAt: null,
        },
      }),

      prisma.payment.count({
        where: {
          orgId,
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

      prisma.payment.count({
        where: {
          orgId,
          OR: [
            {
              gatewayStatus: {
                in: ["INITIATED", "PENDING"],
              },
            },
            {
              gatewayStatus: "SUCCESS",
              verificationStatus: "PENDING",
            },
          ],
        },
      }),
    ]);

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

    const mpesaPayments = paymentMethodGroups
      .filter((item) => item.method === "MPESA_STK")
      .reduce((sum, item) => sum + item._count._all, 0);

    const mpesaSuccessfulPayments = paymentMethodGroups
      .filter(
        (item) => item.method === "MPESA_STK" && item.gatewayStatus === "SUCCESS",
      )
      .reduce((sum, item) => sum + item._count._all, 0);

    const mpesaPendingPayments = paymentMethodGroups
      .filter(
        (item) =>
          item.method === "MPESA_STK" &&
          (item.gatewayStatus === "INITIATED" ||
            item.gatewayStatus === "PENDING" ||
            (item.gatewayStatus === "SUCCESS" &&
              item.verificationStatus === "PENDING")),
      )
      .reduce((sum, item) => sum + item._count._all, 0);

    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const vacancyRate =
      totalUnits > 0 ? Math.round((vacantUnits / totalUnits) * 100) : 0;

    const issuePressure =
      openIssues > 0 ? Math.round((urgentIssues / openIssues) * 100) : 0;

    const apartmentMix =
      totalUnits > 0 ? Math.round((totalApartments / totalUnits) * 100) : 0;

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
      totalCaretakers,
      activeCaretakerAssignments,
      openIssues,
      urgentIssues,
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
    };
  },
  ["org-dashboard-summary-schema-driven-v3"],
  {
    revalidate: 120,
  },
);