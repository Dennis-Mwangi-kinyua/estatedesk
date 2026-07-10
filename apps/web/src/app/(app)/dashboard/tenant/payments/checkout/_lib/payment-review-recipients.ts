import type { Prisma } from "@prisma/client";

export async function getPaymentReviewRecipients(
  tx: Prisma.TransactionClient,
  orgId: string,
) {
  const memberships = await tx.membership.findMany({
    where: {
      orgId,
      role: {
        in: ["ADMIN", "MANAGER", "ACCOUNTANT"],
      },
      user: {
        deletedAt: null,
        status: "ACTIVE",
      },
    },
    select: {
      userId: true,
    },
  });

  return memberships.map((membership) => ({ userId: membership.userId }));
}