import { LeaseStatus } from "@prisma/client";
import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "./types";

const leaseInclude = {
  org: {
    select: {
      id: true,
      name: true,
      currencyCode: true,
    },
  },
  tenant: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      status: true,
    },
  },
  caretaker: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
    },
  },
  contractDocument: {
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      assetType: true,
      createdAt: true,
    },
  },
  unit: {
    select: {
      id: true,
      houseNo: true,
      type: true,
      status: true,
      rentAmount: true,
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
  rentCharges: {
    select: {
      id: true,
      amountDue: true,
      amountPaid: true,
      balance: true,
      status: true,
      dueDate: true,
      chargeType: true,
    },
  },
  taxCharges: {
    select: {
      id: true,
      taxType: true,
      amountDue: true,
      amountPaid: true,
      balance: true,
      status: true,
      dueDate: true,
    },
  },
  moveOutNotices: {
    select: {
      id: true,
      noticeDate: true,
      moveOutDate: true,
      status: true,
    },
  },
} as const;

export async function getOrgLeasesPageData(orgId: string, page = 1) {
  const leaseWhere = {
    orgId,
    deletedAt: null,
  };

  const { page: currentPage, skip, take } = getPagination({
    page,
    pageSize: PAGE_SIZE,
  });

  const [
    organization,
    totalLeases,
    activeLeases,
    pendingLeases,
    expiredLeases,
    terminatedLeases,
    rentAggregate,
    leases,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, currencyCode: true },
    }),
    prisma.lease.count({ where: leaseWhere }),
    prisma.lease.count({
      where: { ...leaseWhere, status: LeaseStatus.ACTIVE },
    }),
    prisma.lease.count({
      where: { ...leaseWhere, status: LeaseStatus.PENDING },
    }),
    prisma.lease.count({
      where: { ...leaseWhere, status: LeaseStatus.EXPIRED },
    }),
    prisma.lease.count({
      where: { ...leaseWhere, status: LeaseStatus.TERMINATED },
    }),
    prisma.lease.aggregate({
      where: leaseWhere,
      _sum: {
        monthlyRent: true,
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
  ]);

  const totalPages = Math.max(1, Math.ceil(totalLeases / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const showingFrom = totalLeases === 0 ? 0 : skip + 1;
  const showingTo = Math.min(skip + leases.length, totalLeases);

  return {
    organizationName: organization?.name ?? "Organisation",
    currencyCode: organization?.currencyCode ?? "KES",
    leases,
    totalLeases,
    activeLeases,
    pendingLeases,
    expiredLeases,
    terminatedLeases,
    totalMonthlyRent: rentAggregate._sum.monthlyRent,
    currentPage: safePage,
    totalPages,
    showingFrom,
    showingTo,
  };
}