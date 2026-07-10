import { prisma } from "@/lib/prisma";
import { toNumber } from "./helpers";

export async function loadTaxesPageData() {
  const hasKraIntegration = "kraIntegration" in prisma;
  const hasTaxpayerProfile = "taxpayerProfile" in prisma;
  const hasRentalIncomeReturn = "rentalIncomeReturn" in prisma;

  const integrations =
    hasKraIntegration && prisma.kraIntegration
      ? await prisma.kraIntegration.findMany({
          orderBy: {
            createdAt: "desc",
          },
          include: {
            org: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        })
      : [];

  const taxpayerProfiles =
    hasTaxpayerProfile && prisma.taxpayerProfile
      ? await prisma.taxpayerProfile.findMany({
          orderBy: {
            createdAt: "desc",
          },
          include: {
            org: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            properties: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
              },
              orderBy: {
                name: "asc",
              },
            },
          },
        })
      : [];

  const recentReturns =
    hasRentalIncomeReturn && prisma.rentalIncomeReturn
      ? await prisma.rentalIncomeReturn.findMany({
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
          include: {
            org: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            property: {
              select: {
                id: true,
                name: true,
              },
            },
            taxpayerProfile: {
              select: {
                id: true,
                displayName: true,
                kraPin: true,
              },
            },
            items: {
              select: {
                id: true,
                grossRent: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            attempts: {
              orderBy: {
                attemptedAt: "desc",
              },
              take: 1,
              select: {
                id: true,
                channel: true,
                outcome: true,
                errorMessage: true,
                attemptedAt: true,
                httpStatus: true,
              },
            },
            linkedTaxCharges: {
              select: {
                id: true,
                amountDue: true,
                amountPaid: true,
                balance: true,
                status: true,
                dueDate: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            linkedPayments: {
              select: {
                id: true,
                amount: true,
                method: true,
                gatewayStatus: true,
                verificationStatus: true,
                paidAt: true,
                createdAt: true,
                kraReference: true,
                kraReceiptNo: true,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        })
      : [];

  const totalReturns = recentReturns.length;
  const draftReturns = recentReturns.filter((item) => item.status === "DRAFT").length;
  const submittedReturns = recentReturns.filter((item) => item.status === "SUBMITTED").length;
  const acknowledgedReturns = recentReturns.filter((item) => item.status === "ACKNOWLEDGED").length;
  const paidReturns = recentReturns.filter((item) => item.status === "PAID").length;
  const nilReturns = recentReturns.filter((item) => item.isNilReturn).length;
  const paymentPendingReturns = recentReturns.filter(
    (item) => item.status === "PAYMENT_PENDING",
  ).length;

  const totalTaxDue = recentReturns.reduce(
    (sum, item) => sum + toNumber(item.taxDue),
    0,
  );

  const totalGrossRent = recentReturns.reduce(
    (sum, item) => sum + toNumber(item.grossRent),
    0,
  );

  const activeIntegrations = integrations.filter(
    (item) => item.status === "ACTIVE",
  ).length;

  const activeTaxpayers = taxpayerProfiles.filter((item) => item.isActive).length;

  return {
    hasKraIntegration,
    hasTaxpayerProfile,
    hasRentalIncomeReturn,
    integrations,
    taxpayerProfiles,
    recentReturns,
    stats: {
      totalReturns,
      draftReturns,
      submittedReturns,
      acknowledgedReturns,
      paidReturns,
      nilReturns,
      paymentPendingReturns,
      totalTaxDue,
      totalGrossRent,
      activeIntegrations,
      activeTaxpayers,
    },
  };
}