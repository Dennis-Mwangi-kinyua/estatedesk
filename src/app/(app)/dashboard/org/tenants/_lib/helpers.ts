import { Prisma } from "@prisma/client";
import type { TenantFilterStatus } from "./types";
import { STATUS_OPTIONS } from "./types";

export function formatStatus(status: string) {
  if (!status) return "Unknown";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function getStatusClasses(status: string) {
  const normalized = String(status).toUpperCase();

  switch (normalized) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "INACTIVE":
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300";
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300";
  }
}

export function normalizeStatus(rawStatus?: string): TenantFilterStatus {
  const value = rawStatus?.trim().toUpperCase() ?? "ALL";

  return STATUS_OPTIONS.includes(value as TenantFilterStatus)
    ? (value as TenantFilterStatus)
    : "ALL";
}

export function normalizeSearch(rawSearch?: string) {
  return rawSearch?.trim().slice(0, 100) ?? "";
}

export function toNumber(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

export function formatCurrency(value: unknown, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function buildFilterHref({
  search,
  status,
  created,
  pageSize,
}: {
  search: string;
  status: TenantFilterStatus;
  created: boolean;
  pageSize: number;
}) {
  const params = new URLSearchParams();

  if (search.trim()) params.set("search", search.trim());
  if (status !== "ALL") params.set("status", status);
  if (created) params.set("created", "1");
  params.set("page", "1");
  params.set("pageSize", String(pageSize));

  return `/dashboard/org/tenants?${params.toString()}`;
}

export function buildTenantWhere({
  orgId,
  search,
  status,
}: {
  orgId: string;
  search: string;
  status: TenantFilterStatus;
}): Prisma.TenantWhereInput {
  return {
    orgId,
    deletedAt: null,
    ...(status !== "ALL" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { nationalId: { contains: search, mode: "insensitive" } },
            { kraPin: { contains: search, mode: "insensitive" } },
            {
              leases: {
                some: {
                  deletedAt: null,
                  unit: {
                    OR: [
                      { houseNo: { contains: search, mode: "insensitive" } },
                      {
                        building: {
                          is: {
                            name: { contains: search, mode: "insensitive" },
                          },
                        },
                      },
                      {
                        property: {
                          is: {
                            OR: [
                              { name: { contains: search, mode: "insensitive" } },
                              { location: { contains: search, mode: "insensitive" } },
                              { address: { contains: search, mode: "insensitive" } },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              leases: {
                some: {
                  deletedAt: null,
                  caretaker: {
                    is: {
                      OR: [
                        { fullName: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
}

export function getTenantDetails(tenant: {
  leases: Array<{
    dueDay: number;
    monthlyRent: unknown;
    caretaker: {
      fullName: string;
      phone: string | null;
      email: string | null;
    } | null;
    unit: {
      houseNo: string;
      type: string;
      bedrooms: number | null;
      building: { name: string } | null;
      property: {
        name: string;
        location: string | null;
        address: string | null;
      };
    };
  }>;
}, currencyCode: string) {
  const lease = tenant.leases[0] ?? null;
  const unit = lease?.unit ?? null;
  const property = unit?.property ?? null;
  const caretaker = lease?.caretaker ?? null;

  return {
    property: property?.name ?? "Not assigned",
    location: property?.location ?? property?.address ?? "No location recorded",
    apartment: unit?.building?.name ?? "No apartment/block",
    unit: unit?.houseNo ? `House ${unit.houseNo}` : "No unit",
    unitType:
      unit?.bedrooms && unit.bedrooms > 0
        ? `${unit.bedrooms} bedroom`
        : unit?.type
          ? formatStatus(unit.type.replaceAll("_", " "))
          : "No unit type",
    caretaker: caretaker?.fullName ?? "No caretaker",
    caretakerContact: caretaker?.phone ?? caretaker?.email ?? "No contact",
    rent: lease ? formatCurrency(lease.monthlyRent, currencyCode) : "No lease",
    dueDay: lease?.dueDay ?? "—",
  };
}