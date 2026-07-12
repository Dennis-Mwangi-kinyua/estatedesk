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
import { buildCaretakerAllocationFilters } from "@/app/(app)/dashboard/caretaker/inspections/[inspectionId]/_lib/helpers";
import { getCaretakerMeterEntryHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { CURRENT_PERIOD } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/types";
import {
  CALENDAR_LOAD_ERROR_MESSAGE,
  endOfWeek,
  parseWeekParam,
  toDayKey,
} from "./helpers";
import type { CalendarEvent } from "./types";

const emptyCalendar = {
  weekStart: new Date(),
  weekLabel: "",
  events: [] as CalendarEvent[],
  stats: {
    inspections: 0,
    meterPending: 0,
    issues: 0,
    moveOuts: 0,
    waterBills: 0,
  },
};

export async function getCaretakerCalendarData({
  orgId,
  caretakerUserId,
  membershipScope,
  week,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  week?: string;
}) {
  const weekStart = parseWeekParam(week);
  const weekEnd = endOfWeek(weekStart);

  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker calendar allowed units" },
    );

    if (allowedUnitIds.length === 0) {
      return {
        ok: true as const,
        ...emptyCalendar,
        weekStart,
      };
    }

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
      { label: "caretaker calendar allocations" },
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
        { unitId: { in: allowedUnitIds } },
      ],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const anchorDay =
      today >= weekStart && today < weekEnd ? today : new Date(weekStart);

    const [
      inspections,
      pendingMeterUnits,
      openIssues,
      moveOutNotices,
      waterBills,
    ] = await retryTransientDatabaseOperation(
      () =>
        Promise.all([
          prisma.inspection.findMany({
            where: {
              status: InspectionStatus.SCHEDULED,
              scheduledAt: {
                gte: weekStart,
                lt: weekEnd,
              },
              AND: [
                {
                  notice: {
                    lease: {
                      orgId,
                      deletedAt: null,
                      unitId: { in: allowedUnitIds },
                    },
                  },
                },
                ...(allocationFilters.length > 0
                  ? [{ OR: allocationFilters }]
                  : []),
              ],
            },
            orderBy: { scheduledAt: "asc" },
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
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
          prisma.unit.findMany({
            where: {
              id: { in: allowedUnitIds },
              isActive: true,
              status: "OCCUPIED",
              leases: { some: { status: "ACTIVE" } },
              meterReadings: {
                none: { period: CURRENT_PERIOD },
              },
            },
            orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }],
            select: {
              id: true,
              houseNo: true,
              property: { select: { name: true } },
              building: { select: { name: true } },
            },
          }),
          prisma.issueTicket.findMany({
            where: issueScope,
            orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
            select: {
              id: true,
              title: true,
              priority: true,
              status: true,
              unit: {
                select: {
                  id: true,
                  houseNo: true,
                  property: { select: { name: true } },
                },
              },
            },
          }),
          prisma.moveOutNotice.findMany({
            where: {
              moveOutDate: {
                gte: weekStart,
                lt: weekEnd,
              },
              lease: {
                orgId,
                unitId: { in: allowedUnitIds },
              },
            },
            orderBy: { moveOutDate: "asc" },
            select: {
              id: true,
              moveOutDate: true,
              status: true,
              tenant: { select: { fullName: true } },
              lease: {
                select: {
                  unit: {
                    select: {
                      id: true,
                      houseNo: true,
                      property: { select: { name: true } },
                    },
                  },
                },
              },
            },
          }),
          prisma.waterBill.findMany({
            where: {
              dueDate: {
                gte: weekStart,
                lt: weekEnd,
              },
              unitId: { in: allowedUnitIds },
            },
            orderBy: { dueDate: "asc" },
            select: {
              id: true,
              dueDate: true,
              period: true,
              status: true,
              total: true,
              unit: {
                select: {
                  id: true,
                  houseNo: true,
                  property: { select: { name: true } },
                },
              },
            },
          }),
        ]),
      { label: "caretaker calendar events" },
    );

    const events: CalendarEvent[] = [];

    for (const inspection of inspections) {
      if (!inspection.scheduledAt) continue;

      const unit = inspection.notice.lease.unit;

      events.push({
        id: `inspection-${inspection.id}`,
        kind: "inspection",
        title: `Inspect ${inspection.notice.tenant.fullName}`,
        subtitle: `${unit.property.name} · House ${unit.houseNo}`,
        date: inspection.scheduledAt,
        href: `/dashboard/caretaker/inspections/${encodePublicId(
          inspection.id,
          "inspection",
        )}`,
        priority: "high",
      });
    }

    for (const unit of pendingMeterUnits) {
      events.push({
        id: `meter-${unit.id}`,
        kind: "meter_reading",
        title: `Read meter · House ${unit.houseNo}`,
        subtitle: `${unit.property.name} · Period ${CURRENT_PERIOD}`,
        date: anchorDay,
        href: getCaretakerMeterEntryHref(unit.id, CURRENT_PERIOD),
        priority: "normal",
      });
    }

    for (const issue of openIssues) {
      const isUrgent = issue.priority === TicketPriority.URGENT;

      events.push({
        id: `issue-${issue.id}`,
        kind: "issue",
        title: issue.title,
        subtitle: issue.unit
          ? `${issue.unit.property.name} · House ${issue.unit.houseNo}`
          : "No unit linked",
        date: anchorDay,
        href: `/dashboard/caretaker/issues?status=${issue.status}${
          isUrgent ? "&priority=URGENT" : ""
        }`,
        priority: isUrgent ? "urgent" : "normal",
      });
    }

    for (const notice of moveOutNotices) {
      if (!notice.moveOutDate) continue;

      const unit = notice.lease.unit;

      events.push({
        id: `move-out-${notice.id}`,
        kind: "move_out",
        title: `${notice.tenant.fullName} move-out`,
        subtitle: `${unit.property.name} · House ${unit.houseNo}`,
        date: notice.moveOutDate,
        href: "/dashboard/caretaker/move-outs",
        priority: "high",
      });
    }

    for (const bill of waterBills) {
      if (!bill.dueDate) continue;

      events.push({
        id: `water-bill-${bill.id}`,
        kind: "water_bill",
        title: `Water bill due · House ${bill.unit.houseNo}`,
        subtitle: `${bill.unit.property.name} · ${bill.period}`,
        date: bill.dueDate,
        href: `/dashboard/caretaker/water-bills/bills/${encodePublicId(
          bill.id,
          "water-bill",
        )}`,
        priority: "normal",
      });
    }

    return {
      ok: true as const,
      weekStart,
      weekLabel: toDayKey(weekStart),
      events,
      stats: {
        inspections: inspections.length,
        meterPending: pendingMeterUnits.length,
        issues: openIssues.length,
        moveOuts: moveOutNotices.length,
        waterBills: waterBills.length,
      },
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: CALENDAR_LOAD_ERROR_MESSAGE,
      ...emptyCalendar,
      weekStart,
    };
  }
}