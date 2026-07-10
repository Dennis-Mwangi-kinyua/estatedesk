import {
  InspectionStatus,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { encodePublicId } from "@/lib/public-id";
import { startOfToday } from "@/app/(app)/dashboard/caretaker/_lib/helpers";
import {
  getCaretakerIssueHref,
  getCaretakerMeterEntryHref,
  getCaretakerUnitHref,
} from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { buildCaretakerAllocationFilters } from "@/app/(app)/dashboard/caretaker/inspections/[inspectionId]/_lib/helpers";
import { CURRENT_PERIOD } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/types";
import { endOfToday, TODAY_WORK_LOAD_ERROR_MESSAGE } from "./helpers";
import type { TodayTask } from "./types";

const emptyTodayStats = {
  dueToday: 0,
  urgentCount: 0,
  meterPending: 0,
  inspectionsToday: 0,
  tasks: [] as TodayTask[],
};

export async function getCaretakerTodayWorkData({
  orgId,
  caretakerUserId,
  membershipScope,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
}) {
  try {
    const today = startOfToday();
    const tomorrow = endOfToday();
    const period = CURRENT_PERIOD;

    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker today work allowed units" },
    );

    const allocations = await retryTransientDatabaseOperation(
      () =>
        prisma.caretakerAssignment.findMany({
          where: {
            orgId,
            caretakerUserId,
            active: true,
          },
          select: {
            propertyId: true,
            buildingId: true,
            unitId: true,
          },
        }),
      { label: "caretaker today work allocations" },
    );

    const propertyIds = allocations
      .map((item) => item.propertyId)
      .filter((value): value is string => Boolean(value));
    const buildingIds = allocations
      .map((item) => item.buildingId)
      .filter((value): value is string => Boolean(value));
    const unitIds = allocations
      .map((item) => item.unitId)
      .filter((value): value is string => Boolean(value));

    const allocationFilters = buildCaretakerAllocationFilters({
      userId: caretakerUserId,
      propertyIds,
      buildingIds,
      unitIds,
    });

    const issueScope = {
      orgId,
      status: {
        in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
      },
      OR: [
        { assignedToUserId: caretakerUserId },
        ...(allowedUnitIds.length > 0
          ? [{ unitId: { in: allowedUnitIds } }]
          : []),
      ],
    };

    const unitScope =
      allowedUnitIds.length > 0
        ? { id: { in: allowedUnitIds }, isActive: true, status: "OCCUPIED" as const }
        : { id: "__none__" };

    const [
      inspectionsToday,
      pendingMeterUnits,
      openIssues,
      urgentIssues,
    ] = await retryTransientDatabaseOperation(
      () =>
        Promise.all([
          allowedUnitIds.length === 0 && allocationFilters.length === 0
            ? Promise.resolve([])
            : prisma.inspection.findMany({
                where: {
                  status: InspectionStatus.SCHEDULED,
                  scheduledAt: {
                    gte: today,
                    lt: tomorrow,
                  },
                  AND: [
                    {
                      notice: {
                        lease: {
                          orgId,
                          deletedAt: null,
                        },
                      },
                    },
                    { OR: allocationFilters },
                  ],
                },
                orderBy: { scheduledAt: "asc" },
                take: 12,
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
                              id: true,
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
          allowedUnitIds.length === 0
            ? Promise.resolve([])
            : prisma.unit.findMany({
                where: {
                  ...unitScope,
                  leases: { some: { status: "ACTIVE" } },
                  meterReadings: {
                    none: {
                      period,
                    },
                  },
                },
                orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }],
                take: 20,
                select: {
                  id: true,
                  houseNo: true,
                  property: { select: { name: true } },
                  building: { select: { name: true } },
                  leases: {
                    where: { status: "ACTIVE" },
                    take: 1,
                    select: {
                      tenant: { select: { fullName: true } },
                    },
                  },
                },
              }),
          prisma.issueTicket.findMany({
            where: issueScope,
            orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
            take: 15,
            select: {
              id: true,
              title: true,
              priority: true,
              status: true,
              createdAt: true,
              assignedToUserId: true,
              unit: {
                select: {
                  id: true,
                  houseNo: true,
                  property: { select: { name: true } },
                  building: { select: { name: true } },
                },
              },
            },
          }),
          prisma.issueTicket.count({
            where: {
              ...issueScope,
              priority: TicketPriority.URGENT,
            },
          }),
        ]),
      { label: "caretaker today work tasks" },
    );

    const tasks: TodayTask[] = [];

    for (const inspection of inspectionsToday) {
      const unit = inspection.notice.lease.unit;
      const location = [
        unit.property.name,
        unit.building?.name,
        `House ${unit.houseNo}`,
      ]
        .filter(Boolean)
        .join(" · ");

      tasks.push({
        id: `inspection-${inspection.id}`,
        kind: "inspection",
        title: `Inspect ${inspection.notice.tenant.fullName}`,
        subtitle: location,
        href: `/dashboard/caretaker/inspections/${encodePublicId(
          inspection.id,
          "inspection",
        )}`,
        unitHref: getCaretakerUnitHref(unit.id),
        priority: "high",
        dueLabel: inspection.scheduledAt
          ? new Intl.DateTimeFormat("en-KE", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(inspection.scheduledAt)
          : "Today",
        actionLabel: "Start inspection",
      });
    }

    for (const unit of pendingMeterUnits) {
      const location = [
        unit.property.name,
        unit.building?.name,
        `House ${unit.houseNo}`,
      ]
        .filter(Boolean)
        .join(" · ");

      tasks.push({
        id: `meter-${unit.id}`,
        kind: "meter_reading",
        title: `Read meter · House ${unit.houseNo}`,
        subtitle: `${location} · ${unit.leases[0]?.tenant.fullName ?? "Occupied"}`,
        href: getCaretakerMeterEntryHref(unit.id, period),
        unitHref: getCaretakerUnitHref(unit.id),
        priority: "normal",
        dueLabel: `Period ${period}`,
        actionLabel: "Enter reading",
      });
    }

    for (const issue of openIssues) {
      const unit = issue.unit;
      const location = unit
        ? [
            unit.property.name,
            unit.building?.name,
            `House ${unit.houseNo}`,
          ]
            .filter(Boolean)
            .join(" · ")
        : "No unit linked";

      const isUrgent = issue.priority === TicketPriority.URGENT;
      const isAssigned = issue.assignedToUserId === caretakerUserId;

      tasks.push({
        id: `issue-${issue.id}`,
        kind: "issue",
        title: issue.title,
        subtitle: `${location} · ${issue.status.replaceAll("_", " ")}`,
        href: getCaretakerIssueHref(issue.id),
        unitHref: unit ? getCaretakerUnitHref(unit.id) : undefined,
        priority: isUrgent ? "urgent" : isAssigned ? "high" : "normal",
        dueLabel: isAssigned ? "Assigned to you" : "In your scope",
        actionLabel:
          issue.status === TicketStatus.OPEN ? "Start work" : "Update issue",
        issueSla: {
          createdAt: issue.createdAt,
          priority: issue.priority,
          status: issue.status,
        },
      });
    }

    const priorityOrder = { urgent: 0, high: 1, normal: 2 } as const;
    tasks.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

    return {
      ok: true as const,
      period,
      dueToday: tasks.length,
      urgentCount: urgentIssues,
      meterPending: pendingMeterUnits.length,
      inspectionsToday: inspectionsToday.length,
      tasks,
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: TODAY_WORK_LOAD_ERROR_MESSAGE,
      period: CURRENT_PERIOD,
      ...emptyTodayStats,
    };
  }
}