import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import {
  addMonths,
  monthLabel,
  startOfMonth,
} from "./helpers";
import type { TrendPoint } from "./types";

export function platformQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 3,
    delayMs: 400,
    label,
  });
}

export async function getOrganizationSeries(months = 6): Promise<TrendPoint[]> {
  const now = new Date();
  const monthStarts = Array.from({ length: months }, (_, i) =>
    startOfMonth(addMonths(now, -(months - 1) + i)),
  );

  const results = await Promise.all(
    monthStarts.map(async (monthStart) => {
      const nextMonth = addMonths(monthStart, 1);

      const value = await platformQuery("platform-org-series", () =>
        prisma.organization.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: monthStart,
              lt: nextMonth,
            },
          },
        }),
      );

      return {
        label: monthLabel(monthStart),
        value,
      };
    }),
  );

  return results;
}

export async function getRevenueSeries(months = 6): Promise<TrendPoint[]> {
  const now = new Date();
  const monthStarts = Array.from({ length: months }, (_, i) =>
    startOfMonth(addMonths(now, -(months - 1) + i)),
  );

  const results = await Promise.all(
    monthStarts.map(async (monthStart) => {
      const nextMonth = addMonths(monthStart, 1);

      const agg = await platformQuery("platform-revenue-series", () =>
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            paidAt: {
              gte: monthStart,
              lt: nextMonth,
            },
            verificationStatus: "VERIFIED",
          },
        }),
      );

      return {
        label: monthLabel(monthStart),
        value: Number(agg._sum.amount ?? 0),
      };
    }),
  );

  return results;
}