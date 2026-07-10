import {
  BillStatus,
  InspectionStatus,
  LeaseStatus,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { startOfToday } from "@/app/(app)/dashboard/caretaker/_lib/helpers";
import type { CaretakerDashboardResult } from "@/app/(app)/dashboard/caretaker/_lib/types";

export const DASHBOARD_LOAD_ERROR_MESSAGE =
  "We couldn't load your caretaker dashboard right now. Please refresh the page or try again in a few minutes.";

export async function getCaretakerDashboardData({
  orgId,
  userId,
  membershipScope,
}: {
  orgId: string;
  userId: string;
  membershipScope: MembershipScope;
}): Promise<CaretakerDashboardResult> {
  try {
  const allowedUnitIds = await getCaretakerAllowedUnitIds({
    orgId,
    caretakerUserId: userId,
    membershipScope,
  });

  const today = startOfToday();
  const issueScope = {
    orgId,
    OR: [
      { assignedToUserId: userId },
      ...(allowedUnitIds.length > 0
        ? [{ unitId: { in: allowedUnitIds } }]
        : []),
    ],
  };
  const unitScope =
    allowedUnitIds.length > 0 ? { id: { in: allowedUnitIds } } : { id: "__none__" };

  const [
    assignedUnits,
    activeLeases,
    activeTenants,
    openIssues,
    resolvedToday,
    urgentIssues,
    scheduledInspections,
    completedInspectionsToday,
    pendingWaterBills,
    recentIssues,
    upcomingInspections,
  ] = await retryTransientDatabaseOperation(
    () =>
      Promise.all([
        prisma.unit.count({ where: unitScope }),
        prisma.lease.count({
          where: {
            orgId,
            deletedAt: null,
            status: LeaseStatus.ACTIVE,
            unitId: {
              in: allowedUnitIds,
            },
          },
        }),
        prisma.tenant.count({
          where: {
            orgId,
            deletedAt: null,
            leases: {
              some: {
                deletedAt: null,
                status: LeaseStatus.ACTIVE,
                unitId: {
                  in: allowedUnitIds,
                },
              },
            },
          },
        }),
        prisma.issueTicket.count({
          where: {
            ...issueScope,
            status: {
              in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
            },
          },
        }),
        prisma.issueTicket.count({
          where: {
            ...issueScope,
            status: {
              in: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
            },
            resolvedAt: {
              gte: today,
            },
          },
        }),
        prisma.issueTicket.count({
          where: {
            ...issueScope,
            priority: TicketPriority.URGENT,
            status: {
              notIn: [
                TicketStatus.RESOLVED,
                TicketStatus.CLOSED,
                TicketStatus.CANCELLED,
              ],
            },
          },
        }),
        prisma.inspection.count({
          where: {
            status: InspectionStatus.SCHEDULED,
            OR: [
              { inspectorUserId: userId },
              {
                notice: {
                  lease: {
                    orgId,
                    unitId: {
                      in: allowedUnitIds,
                    },
                  },
                },
              },
            ],
          },
        }),
        prisma.inspection.count({
          where: {
            status: InspectionStatus.COMPLETED,
            completedAt: {
              gte: today,
            },
            OR: [
              { inspectorUserId: userId },
              {
                notice: {
                  lease: {
                    orgId,
                    unitId: {
                      in: allowedUnitIds,
                    },
                  },
                },
              },
            ],
          },
        }),
        prisma.waterBill.count({
          where: {
            orgId,
            unitId: {
              in: allowedUnitIds,
            },
            status: {
              in: [
                BillStatus.ISSUED,
                BillStatus.PAYMENT_PENDING,
                BillStatus.PAID_PENDING_VERIFICATION,
                BillStatus.DISPUTED,
              ],
            },
          },
        }),
        prisma.issueTicket.findMany({
          where: issueScope,
          orderBy: {
            updatedAt: "desc",
          },
          take: 4,
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            unit: {
              select: {
                houseNo: true,
                property: { select: { name: true } },
                building: { select: { name: true } },
              },
            },
          },
        }),
        prisma.inspection.findMany({
          where: {
            status: InspectionStatus.SCHEDULED,
            OR: [
              { inspectorUserId: userId },
              {
                notice: {
                  lease: {
                    orgId,
                    unitId: {
                      in: allowedUnitIds,
                    },
                  },
                },
              },
            ],
          },
          orderBy: {
            scheduledAt: "asc",
          },
          take: 3,
          select: {
            id: true,
            scheduledAt: true,
            notice: {
              select: {
                tenant: { select: { fullName: true } },
                lease: {
                  select: {
                    unit: {
                      select: {
                        houseNo: true,
                        property: { select: { name: true } },
                        building: { select: { name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      ]),
    { label: "caretaker dashboard data load" },
  );

  return {
    ok: true,
    data: {
      assignedUnits,
      activeLeases,
      activeTenants,
      openIssues,
      resolvedToday,
      urgentIssues,
      scheduledInspections,
      completedInspectionsToday,
      pendingWaterBills,
      recentIssues,
      upcomingInspections,
    },
  };
  } catch {
    return {
      ok: false,
      errorMessage: DASHBOARD_LOAD_ERROR_MESSAGE,
    };
  }
}