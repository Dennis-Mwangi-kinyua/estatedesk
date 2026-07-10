import { Prisma } from "@prisma/client";
import { getPagination } from "@/lib/db/pagination";
import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { UNITS_LOAD_ERROR_MESSAGE } from "./helpers";
import { PAGE_SIZE } from "./types";

const emptyUnitsPage = {
  units: [],
  totalUnits: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  currentPage: 1,
  totalPages: 1,
  showingFrom: 0,
  showingTo: 0,
} as const;

export async function getCaretakerUnitsData({
  orgId,
  caretakerUserId,
  membershipScope,
  page = 1,
  query = "",
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  page?: number;
  query?: string;
}) {
  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker units allowed units" },
    );

    if (allowedUnitIds.length === 0) {
      return {
        ok: true as const,
        query,
        ...emptyUnitsPage,
      };
    }

    const search = query.trim();
    const unitWhere: Prisma.UnitWhereInput = {
      id: { in: allowedUnitIds },
      isActive: true,
      deletedAt: null,
    };

    if (search) {
      unitWhere.AND = [
        {
          OR: [
            { houseNo: { contains: search, mode: "insensitive" } },
            {
              property: {
                name: { contains: search, mode: "insensitive" },
              },
            },
            {
              building: {
                is: {
                  name: { contains: search, mode: "insensitive" },
                },
              },
            },
            {
              leases: {
                some: {
                  status: "ACTIVE",
                  tenant: {
                    fullName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
          ],
        },
      ];
    }

    const { page: currentPage, skip, take } = getPagination({
      page,
      pageSize: PAGE_SIZE,
    });

    const [units, totalUnits, occupiedUnits, vacantUnits] =
      await retryTransientDatabaseOperation(
        () =>
          Promise.all([
            prisma.unit.findMany({
              where: unitWhere,
              orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }],
              skip,
              take,
              select: {
                id: true,
                houseNo: true,
                status: true,
                property: { select: { name: true } },
                building: { select: { name: true } },
                leases: {
                  where: { status: "ACTIVE", deletedAt: null },
                  take: 1,
                  select: {
                    tenant: { select: { fullName: true } },
                  },
                },
                issues: {
                  where: {
                    status: { in: ["OPEN", "IN_PROGRESS"] },
                  },
                  select: { id: true },
                },
              },
            }),
            prisma.unit.count({ where: unitWhere }),
            prisma.unit.count({
              where: { ...unitWhere, status: "OCCUPIED" },
            }),
            prisma.unit.count({
              where: { ...unitWhere, status: "VACANT" },
            }),
          ]),
        { label: "caretaker units page data" },
      );

    const totalPages = Math.max(1, Math.ceil(totalUnits / PAGE_SIZE));

    return {
      ok: true as const,
      query,
      units,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      currentPage,
      totalPages,
      showingFrom: totalUnits === 0 ? 0 : skip + 1,
      showingTo: Math.min(skip + units.length, totalUnits),
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: UNITS_LOAD_ERROR_MESSAGE,
      query,
      ...emptyUnitsPage,
    };
  }
}