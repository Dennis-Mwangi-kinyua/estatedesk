import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toNumber } from "./helpers";

export async function loadLeaseDetailsData(orgId: string, leaseId: string) {
  const lease = await prisma.lease.findFirst({
    where: {
      id: leaseId,
      orgId,
      deletedAt: null,
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          currencyCode: true,
          address: true,
        },
      },
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          nationalId: true,
          companyName: true,
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
          fileType: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      },
      unit: {
        select: {
          id: true,
          houseNo: true,
          type: true,
          bedrooms: true,
          bathrooms: true,
          rentAmount: true,
          depositAmount: true,
          status: true,
          notes: true,
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              location: true,
              address: true,
            },
          },
          building: {
            select: {
              id: true,
              name: true,
              notes: true,
            },
          },
        },
      },
      rentCharges: {
        orderBy: {
          dueDate: "desc",
        },
        select: {
          id: true,
          period: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          dueDate: true,
          status: true,
          chargeType: true,
          description: true,
        },
      },
      taxCharges: {
        orderBy: {
          dueDate: "desc",
        },
        select: {
          id: true,
          period: true,
          taxType: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          dueDate: true,
          status: true,
          taxAuthority: true,
          kraPaymentRef: true,
          kraReceiptNo: true,
        },
      },
      moveOutNotices: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          noticeDate: true,
          moveOutDate: true,
          status: true,
          notes: true,
          inspection: {
            select: {
              id: true,
              scheduledAt: true,
              status: true,
              completedAt: true,
              inspector: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      },
      tenantActionLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          action: true,
          reason: true,
          notes: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!lease) {
    notFound();
  }

  const currencyCode = lease.org.currencyCode ?? "KES";

  const totalRentCharges = lease.rentCharges.reduce(
    (sum, charge) => sum + toNumber(charge.amountDue),
    0,
  );

  const totalRentPaid = lease.rentCharges.reduce(
    (sum, charge) => sum + toNumber(charge.amountPaid),
    0,
  );

  const totalRentBalance = lease.rentCharges.reduce(
    (sum, charge) => sum + toNumber(charge.balance),
    0,
  );

  const totalTaxCharges = lease.taxCharges.reduce(
    (sum, charge) => sum + toNumber(charge.amountDue),
    0,
  );

  return {
    lease,
    currencyCode,
    totalRentCharges,
    totalRentPaid,
    totalRentBalance,
    totalTaxCharges,
  };
}