import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma, PropertyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { PAGE_SIZE, PROPERTY_TYPES } from "./types";
import { toPositiveInt } from "./helpers";
import type { PropertiesSearchParams } from "./types";

export const getCurrentOrgContext = cache(async function getCurrentOrgContext() {
  const session = await requireUserSession();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (membership) return membership;

  const fallbackMembership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (!fallbackMembership) redirect("/dashboard");

  return fallbackMembership;
});

export async function loadPropertiesPageData(
  searchParams?: PropertiesSearchParams,
) {
  const membership = await getCurrentOrgContext();
  const params = searchParams ?? {};

  const created = params.created === "1";
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const type =
    typeof params.type === "string" &&
    PROPERTY_TYPES.some((item) => item.value === params.type)
      ? params.type
      : "all";
  const status =
    typeof params.status === "string" &&
    ["all", "active", "inactive"].includes(params.status)
      ? params.status
      : "all";

  const currentPage = toPositiveInt(params.page);

  const where: Prisma.PropertyWhereInput = {
    orgId: membership.orgId,
    deletedAt: null,
  };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { location: { contains: query, mode: "insensitive" } },
      { address: { contains: query, mode: "insensitive" } },
      { notes: { contains: query, mode: "insensitive" } },
      {
        taxpayerProfile: {
          is: {
            displayName: { contains: query, mode: "insensitive" },
          },
        },
      },
      {
        taxpayerProfile: {
          is: {
            kraPin: { contains: query, mode: "insensitive" },
          },
        },
      },
    ];
  }

  if (type !== "all") {
    where.type = type as PropertyType;
  }

  if (status === "active") {
    where.isActive = true;
  }

  if (status === "inactive") {
    where.isActive = false;
  }

  const [
    overallProperties,
    activeProperties,
    totalBuildingsAggregate,
    totalUnitsAggregate,
    filteredTotal,
    properties,
  ] = await Promise.all([
    prisma.property.count({
      where: {
        orgId: membership.orgId,
        deletedAt: null,
      },
    }),
    prisma.property.count({
      where: {
        orgId: membership.orgId,
        deletedAt: null,
        isActive: true,
      },
    }),
    prisma.building.count({
      where: {
        deletedAt: null,
        property: {
          orgId: membership.orgId,
          deletedAt: null,
        },
      },
    }),
    prisma.unit.count({
      where: {
        deletedAt: null,
        property: {
          orgId: membership.orgId,
          deletedAt: null,
        },
      },
    }),
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        address: true,
        notes: true,
        isActive: true,
        waterRatePerUnit: true,
        waterFixedCharge: true,
        createdAt: true,
        taxpayerProfile: {
          select: {
            id: true,
            displayName: true,
            kraPin: true,
            kind: true,
          },
        },
        _count: {
          select: {
            buildings: true,
            units: true,
            issues: true,
          },
        },
      },
    }),
  ]);

  const inactiveProperties = overallProperties - activeProperties;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const showingFrom = filteredTotal === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safeCurrentPage * PAGE_SIZE, filteredTotal);
  const hasFilters = Boolean(query) || type !== "all" || status !== "all";

  return {
    membership,
    created,
    query,
    type,
    status,
    overallProperties,
    activeProperties,
    inactiveProperties,
    totalBuildingsAggregate,
    totalUnitsAggregate,
    filteredTotal,
    properties,
    totalPages,
    safeCurrentPage,
    showingFrom,
    showingTo,
    hasFilters,
  };
}