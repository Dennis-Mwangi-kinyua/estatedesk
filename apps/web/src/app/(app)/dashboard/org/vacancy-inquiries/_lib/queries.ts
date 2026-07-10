import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { INQUIRY_STATUSES, PAGE_SIZE, type InquiryStatus } from "./types";

export async function getVacancyInquiriesPageData(
  orgId: string,
  page = 1,
  statusFilter?: string,
) {
  const status =
    statusFilter &&
    INQUIRY_STATUSES.includes(statusFilter as InquiryStatus)
      ? (statusFilter as InquiryStatus)
      : undefined;

  const inquiryWhere = {
    orgId,
    ...(status ? { status } : {}),
  };

  const { page: currentPage, skip, take } = getPagination({
    page,
    pageSize: PAGE_SIZE,
  });

  const [
    org,
    totalInquiries,
    newCount,
    contactedCount,
    viewingCount,
    convertedCount,
    closedCount,
    inquiries,
  ] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { name: true },
    }),
    prisma.vacancyInquiry.count({ where: inquiryWhere }),
    prisma.vacancyInquiry.count({
      where: { orgId, status: "NEW" },
    }),
    prisma.vacancyInquiry.count({
      where: { orgId, status: "CONTACTED" },
    }),
    prisma.vacancyInquiry.count({
      where: { orgId, status: "VIEWING_SCHEDULED" },
    }),
    prisma.vacancyInquiry.count({
      where: { orgId, status: "CONVERTED" },
    }),
    prisma.vacancyInquiry.count({
      where: { orgId, status: "CLOSED" },
    }),
    prisma.vacancyInquiry.findMany({
      where: inquiryWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        message: true,
        status: true,
        createdAt: true,
        unitId: true,
        unit: {
          select: {
            houseNo: true,
            property: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalInquiries / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const showingFrom = totalInquiries === 0 ? 0 : skip + 1;
  const showingTo = Math.min(skip + inquiries.length, totalInquiries);

  return {
    org,
    inquiries,
    totalInquiries,
    newCount,
    contactedCount,
    viewingCount,
    convertedCount,
    closedCount,
    currentPage: safePage,
    totalPages,
    showingFrom,
    showingTo,
    statusFilter: status ?? "ALL",
  };
}