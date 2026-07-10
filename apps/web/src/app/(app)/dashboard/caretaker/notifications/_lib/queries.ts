import { getPagination } from "@/lib/db/pagination";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { NOTIFICATIONS_LOAD_ERROR_MESSAGE } from "./helpers";
import { PAGE_SIZE } from "./types";

const emptyNotificationsPage = {
  notifications: [],
  unreadCount: 0,
  totalNotifications: 0,
  currentPage: 1,
  totalPages: 1,
  showingFrom: 0,
  showingTo: 0,
} as const;

export async function getCaretakerNotificationsData(args: {
  orgId: string;
  userId: string;
  page?: number;
}) {
  try {
    const where = {
      orgId: args.orgId,
      userId: args.userId,
    };

    const { page: currentPage, skip, take } = getPagination({
      page: args.page,
      pageSize: PAGE_SIZE,
    });

    const [totalNotifications, unreadCount, notifications] =
      await retryTransientDatabaseOperation(
        () =>
          Promise.all([
            prisma.notification.count({ where }),
            prisma.notification.count({
              where: {
                ...where,
                readAt: null,
              },
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
                type: true,
                channel: true,
                status: true,
                readAt: true,
                createdAt: true,
              },
            }),
          ]),
        { label: "caretaker notifications page data" },
      );

    const totalPages = Math.max(1, Math.ceil(totalNotifications / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const showingFrom = totalNotifications === 0 ? 0 : skip + 1;
    const showingTo = Math.min(skip + notifications.length, totalNotifications);

    return {
      ok: true as const,
      notifications,
      unreadCount,
      totalNotifications,
      currentPage: safePage,
      totalPages,
      showingFrom,
      showingTo,
    };
  } catch (error) {
    logServerError("caretaker.notifications.load", error);

    return {
      ok: false as const,
      errorMessage: NOTIFICATIONS_LOAD_ERROR_MESSAGE,
      ...emptyNotificationsPage,
      notifications: [],
    };
  }
}