import { prisma } from "@/lib/prisma";
import {
  getCaretakerManagedBuildingUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import {
  decodePublicId,
  encodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import {
  formatCurrency,
  toNumber,
} from "@/app/(app)/dashboard/caretaker/water-bills/_lib/helpers";
import { BILL_DETAIL_LOAD_ERROR_MESSAGE } from "./helpers";

export async function getCaretakerBillDetailData({
  orgId,
  caretakerUserId,
  membershipScope,
  publicBillId,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  publicBillId: string;
}) {
  const billId = decodePublicId(publicBillId, "water-bill");

  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerManagedBuildingUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker bill detail allowed units" },
    );

    const bill = await retryTransientDatabaseOperation(
      () =>
        prisma.waterBill.findUnique({
          where: { id: billId },
          include: {
            tenant: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
            unit: {
              select: {
                id: true,
                houseNo: true,
                building: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                reference: true,
                externalReference: true,
                gatewayStatus: true,
                verificationStatus: true,
                paidAt: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        }),
      { label: "caretaker bill detail load" },
    );

    if (!bill || !allowedUnitIds.includes(bill.unitId)) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This water bill could not be found.",
        redirectTo: null,
      };
    }

    const redirectTo = !isEncodedPublicId(publicBillId)
      ? `/dashboard/caretaker/water-bills/bills/${encodePublicId(
          bill.id,
          "water-bill",
        )}`
      : null;

    const totalPaid = bill.payments.reduce(
      (sum, payment) => sum + toNumber(payment.amount),
      0,
    );
    const balance = Math.max(toNumber(bill.total) - totalPaid, 0);

    return {
      ok: true as const,
      redirectTo,
      bill,
      totalPaid: formatCurrency(totalPaid),
      balance: formatCurrency(balance),
      hasOutstandingBalance: balance > 0,
    };
  } catch {
    return {
      ok: false as const,
      notFound: false,
      errorMessage: BILL_DETAIL_LOAD_ERROR_MESSAGE,
      redirectTo: null,
    };
  }
}