import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "./helpers";
import type { TenantVerificationResult } from "./types";

export async function loadVerifyTenantPageData(
  activeOrgId: string,
  searchParams?: { q?: string },
) {
  const search = normalizeSearch(searchParams?.q);
  const canSearch = search.length >= 3;

  const incomingTransferRequests = await prisma.tenantTransferRequest.findMany({
    where: {
      sourceOrgId: activeOrgId,
      status: "PENDING",
    },
    orderBy: {
      requestedAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      message: true,
      requestedAt: true,
      targetOrg: {
        select: {
          name: true,
        },
      },
      requestedBy: {
        select: {
          fullName: true,
          email: true,
        },
      },
      sourceTenant: {
        select: {
          fullName: true,
          phone: true,
          email: true,
          nationalId: true,
          status: true,
          moveOutNotices: {
            orderBy: {
              moveOutDate: "desc",
            },
            take: 1,
            select: {
              moveOutDate: true,
              status: true,
            },
          },
        },
      },
    },
  });

  let results: TenantVerificationResult[] = [];

  if (canSearch) {
    results = await prisma.tenant.findMany({
      where: {
        deletedAt: null,
        OR: [
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { nationalId: { contains: search, mode: "insensitive" } },
          { kraPin: { contains: search, mode: "insensitive" } },
          { fullName: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: [{ orgId: "asc" }, { createdAt: "desc" }],
      take: 25,
      select: {
        id: true,
        orgId: true,
        fullName: true,
        phone: true,
        email: true,
        nationalId: true,
        kraPin: true,
        status: true,
        identityId: true,
        blacklistReason: true,
        blacklistedAt: true,
        createdAt: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        leases: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            startDate: "desc",
          },
          take: 5,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            monthlyRent: true,
            unit: {
              select: {
                houseNo: true,
                property: {
                  select: {
                    name: true,
                  },
                },
                building: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 12,
          select: {
            id: true,
            amount: true,
            targetType: true,
            gatewayStatus: true,
            verificationStatus: true,
            paidAt: true,
            createdAt: true,
          },
        },
        moveOutNotices: {
          orderBy: {
            moveOutDate: "desc",
          },
          take: 5,
          select: {
            id: true,
            status: true,
            noticeDate: true,
            moveOutDate: true,
          },
        },
        transferRequests: {
          where: {
            targetOrgId: activeOrgId,
          },
          orderBy: {
            requestedAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            status: true,
            createdTenantId: true,
            requestedAt: true,
            reviewedAt: true,
          },
        },
        identity: {
          select: {
            id: true,
            historyRecords: {
              orderBy: [{ moveOutDate: "desc" }, { createdAt: "desc" }],
              take: 10,
              select: {
                id: true,
                orgId: true,
                status: true,
                propertyName: true,
                buildingName: true,
                unitHouseNo: true,
                leaseStartDate: true,
                leaseEndDate: true,
                moveOutDate: true,
                monthlyRent: true,
                paymentCount: true,
                totalPaid: true,
                notes: true,
                createdAt: true,
                org: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            tenants: {
              orderBy: {
                createdAt: "desc",
              },
              take: 10,
              select: {
                id: true,
                orgId: true,
                fullName: true,
                status: true,
                archivedAt: true,
                org: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  const currentOrgResults = results.filter((result) => result.orgId === activeOrgId);
  const otherOrgResults = results.filter((result) => result.orgId !== activeOrgId);

  return {
    search,
    canSearch,
    results,
    incomingTransferRequests,
    currentOrgResults,
    otherOrgResults,
    hasResults: results.length > 0,
  };
}