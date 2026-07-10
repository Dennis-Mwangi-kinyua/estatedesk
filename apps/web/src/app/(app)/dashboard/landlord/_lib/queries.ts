import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/ledger";
import {
  buildDashboardData,
  buildPropertiesFromProfile,
} from "@/app/(app)/dashboard/landlord/_lib/build-dashboard-data";

async function fetchLandlordProfile(orgId: string, userId: string) {
  const currentPeriod = getCurrentPeriod();

  return prisma.landlordProfile.findFirst({
    where: {
      orgId,
      userId,
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      displayName: true,
      assignments: {
        where: {
          active: true,
          endedAt: null,
        },
        select: {
          property: {
            select: {
              id: true,
              name: true,
              location: true,
              address: true,
              units: {
                where: {
                  deletedAt: null,
                  isActive: true,
                },
                select: {
                  id: true,
                  houseNo: true,
                  rentAmount: true,
                  status: true,
                  leases: {
                    where: {
                      deletedAt: null,
                      status: "ACTIVE",
                    },
                    select: {
                      id: true,
                      tenant: {
                        select: {
                          fullName: true,
                        },
                      },
                      rentCharges: {
                        where: {
                          period: currentPeriod,
                          chargeType: "RENT",
                        },
                        select: {
                          amountDue: true,
                          amountPaid: true,
                          balance: true,
                          status: true,
                        },
                        take: 1,
                      },
                    },
                    take: 1,
                  },
                },
                orderBy: {
                  houseNo: "asc",
                },
              },
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
                  location: true,
                  address: true,
                },
              },
              leases: {
                where: {
                  deletedAt: null,
                  status: "ACTIVE",
                },
                select: {
                  id: true,
                  tenant: {
                    select: {
                      fullName: true,
                    },
                  },
                  rentCharges: {
                    where: {
                      period: currentPeriod,
                      chargeType: "RENT",
                    },
                    select: {
                      amountDue: true,
                      amountPaid: true,
                      balance: true,
                      status: true,
                    },
                    take: 1,
                  },
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
}

export async function getLandlordDashboardData(orgId: string, userId: string) {
  const profile = await fetchLandlordProfile(orgId, userId);

  if (!profile) {
    return null;
  }

  const properties = buildPropertiesFromProfile(profile);

  return buildDashboardData(profile, properties);
}