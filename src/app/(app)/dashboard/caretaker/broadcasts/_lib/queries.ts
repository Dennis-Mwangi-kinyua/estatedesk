import { NotificationType } from "@prisma/client";
import { getPagination } from "@/lib/db/pagination";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { BROADCASTS_LOAD_ERROR_MESSAGE } from "./helpers";

const PAGE_SIZE = 20;

export async function getCaretakerBroadcastsData({
  orgId,
  userId,
  page = 1,
}: {
  orgId: string;
  userId: string;
  page?: number;
}) {
  try {
    const where = {
      orgId,
      userId,
      type: NotificationType.GENERAL,
    };

    const { skip, take, page: currentPage } = getPagination({
      page,
      pageSize: PAGE_SIZE,
    });

    const [totalBroadcasts, unreadCount, broadcasts] =
      await retryTransientDatabaseOperation(
        () =>
          Promise.all([
            prisma.notification.count({ where }),
            prisma.notification.count({
              where: { ...where, readAt: null },
            }),
            prisma.notification.findMany({
              where,
              orderBy: { createdAt: "desc" },
              skip,
              take,
              select: {
                id: true,
                title: true,
                message: true,
                readAt: true,
                createdAt: true,
              },
            }),
          ]),
        { label: "caretaker broadcasts page data" },
      );

    const totalPages = Math.max(1, Math.ceil(totalBroadcasts / PAGE_SIZE));

    return {
      ok: true as const,
      broadcasts,
      unreadCount,
      totalBroadcasts,
      currentPage: Math.min(currentPage, totalPages),
      totalPages,
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: BROADCASTS_LOAD_ERROR_MESSAGE,
      broadcasts: [],
      unreadCount: 0,
      totalBroadcasts: 0,
      currentPage: 1,
      totalPages: 1,
    };
  }
}