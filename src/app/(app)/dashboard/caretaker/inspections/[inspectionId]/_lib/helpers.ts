import type { Prisma } from "@prisma/client";

export type ReportData = Record<string, unknown>;

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function toValidDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: Date | string | null | undefined) {
  const date = toValidDate(value);
  return date ? dateFormatter.format(date) : "—";
}

export function formatDateTime(value: Date | string | null | undefined) {
  const date = toValidDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

export function readBool(report: ReportData, key: string): "Yes" | "No" {
  return report[key] === true ? "Yes" : "No";
}

export function readText(value: unknown, fallback = "—") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function buildCaretakerAllocationFilters(args: {
  userId: string;
  propertyIds: string[];
  buildingIds: string[];
  unitIds: string[];
}) {
  const { userId, propertyIds, buildingIds, unitIds } = args;
  const filters: Prisma.InspectionWhereInput[] = [
    {
      notice: {
        lease: {
          caretakerUserId: userId,
        },
      },
    },
  ];

  if (unitIds.length > 0) {
    filters.push({
      notice: {
        lease: {
          unitId: { in: unitIds },
        },
      },
    });
  }

  if (buildingIds.length > 0) {
    filters.push({
      notice: {
        lease: {
          unit: {
            buildingId: { in: buildingIds },
          },
        },
      },
    });
  }

  if (propertyIds.length > 0) {
    filters.push({
      notice: {
        lease: {
          unit: {
            propertyId: { in: propertyIds },
          },
        },
      },
    });
  }

  return filters;
}
