import { LeaseStatus } from "@prisma/client";
import { getPagination } from "@/lib/db/pagination";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { LEASES_LOAD_ERROR_MESSAGE } from "./helpers";
import { PAGE_SIZE } from "./types";

const leaseInclude = {
  tenant: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      status: true,
    },
  },
  unit: {
    select: {
      id: true,
      houseNo: true,
      rentAmount: true,
      status: true,
      property: {
        select: {
          id: true,
          name: true,
        },
      },
      building: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

const emptyLeasePage = {
  leases: [],
  totalLeases: 0,
  activeLeases: 0,
  nonActiveLeases: 0,
  currentPage: 1,
  totalPages: 1,
  showingFrom: 0,
  showingTo: 0,
} as const;

export async function getCaretakerLeasesData(args: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: Parameters<typeof getCaretakerAllowedUnitIds>[0]["membershipScope"];
  page?: number;
}) {
  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId: args.orgId,
          caretakerUserId: args.caretakerUserId,
          membershipScope: args.membershipScope,
        }),
      { label: "caretaker leases allowed units" },
    );

    if (allowedUnitIds.length === 0) {
      return {
        ok: true as const,
        ...emptyLeasePage,
        leases: [],
      };
    }

    const leaseWhere = {
      orgId: args.orgId,
      deletedAt: null,
      unitId: {
        in: allowedUnitIds,
      },
    };

    const { page, skip, take } = getPagination({
      page: args.page,
      pageSize: PAGE_SIZE,
    });

    const [totalLeases, activeLeases, leases] =
      await retryTransientDatabaseOperation(
        () =>
          Promise.all([
            prisma.lease.count({ where: leaseWhere }),
            prisma.lease.count({
              where: {
                ...leaseWhere,
                status: LeaseStatus.ACTIVE,
              },
            }),
            prisma.lease.findMany({
              where: leaseWhere,
              orderBy: {
                createdAt: "desc",
              },
              skip,
              take,
              include: leaseInclude,
            }),
          ]),
        { label: "caretaker leases page data" },
      );

    const totalPages = Math.max(1, Math.ceil(totalLeases / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const showingFrom = totalLeases === 0 ? 0 : skip + 1;
    const showingTo = Math.min(skip + leases.length, totalLeases);

    return {
      ok: true as const,
      leases,
      totalLeases,
      activeLeases,
      nonActiveLeases: totalLeases - activeLeases,
      currentPage,
      totalPages,
      showingFrom,
      showingTo,
    };
  } catch (error) {
    logServerError("caretaker.leases.load", error);

    return {
      ok: false as const,
      errorMessage: LEASES_LOAD_ERROR_MESSAGE,
      ...emptyLeasePage,
      leases: [],
    };
  }
}