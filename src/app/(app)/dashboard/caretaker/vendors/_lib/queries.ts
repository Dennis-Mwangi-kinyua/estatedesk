import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { VENDORS_LOAD_ERROR_MESSAGE } from "./helpers";

export async function getCaretakerVendorsData({ orgId }: { orgId: string }) {
  try {
    const vendors = await retryTransientDatabaseOperation(
      () =>
        prisma.accountingVendor.findMany({
          where: {
            orgId,
            isActive: true,
          },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true,
          },
        }),
      { label: "caretaker vendors page data" },
    );

    return {
      ok: true as const,
      vendors,
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: VENDORS_LOAD_ERROR_MESSAGE,
      vendors: [],
    };
  }
}