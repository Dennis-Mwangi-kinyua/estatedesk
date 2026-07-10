import { TicketPriority, TicketStatus } from "@prisma/client";
import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { buildHandoverPrefillByLocale } from "./handover-prefill";
import { HANDOVER_LOAD_ERROR_MESSAGE } from "./helpers";

export async function getCaretakerHandoverData({
  orgId,
  caretakerUserId,
  membershipScope,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
}) {
  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker handover allowed units" },
    );

    const [handovers, openIssues] = await retryTransientDatabaseOperation(
      () =>
        Promise.all([
          prisma.auditLog.findMany({
            where: {
              orgId,
              action: "CARETAKER_SHIFT_HANDOVER",
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true,
              createdAt: true,
              metadata: true,
              actor: {
                select: {
                  fullName: true,
                },
              },
            },
          }),
          allowedUnitIds.length === 0
            ? Promise.resolve([])
            : prisma.issueTicket.findMany({
                where: {
                  orgId,
                  status: {
                    in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
                  },
                  OR: [
                    { assignedToUserId: caretakerUserId },
                    { unitId: { in: allowedUnitIds } },
                  ],
                },
                orderBy: [
                  { priority: "desc" },
                  { createdAt: "asc" },
                ],
                take: 12,
                select: {
                  id: true,
                  title: true,
                  priority: true,
                  status: true,
                  unit: {
                    select: {
                      houseNo: true,
                      property: { select: { name: true } },
                    },
                  },
                },
              }),
        ]),
      { label: "caretaker handover logs" },
    );

    const urgentCount = openIssues.filter(
      (issue) => issue.priority === TicketPriority.URGENT,
    ).length;

    const prefillNotesByLocale = buildHandoverPrefillByLocale(
      openIssues,
      urgentCount,
    );

    return {
      ok: true as const,
      handovers,
      openIssues,
      urgentCount,
      prefillNotesByLocale,
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: HANDOVER_LOAD_ERROR_MESSAGE,
      handovers: [],
      openIssues: [],
      urgentCount: 0,
      prefillNotesByLocale: buildHandoverPrefillByLocale([], 0),
    };
  }
}