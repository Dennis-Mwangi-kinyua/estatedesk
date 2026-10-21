import type { Prisma } from "@prisma/client";

export async function redeemPasswordLink(tx: Pick<Prisma.TransactionClient, "passwordResetToken" | "user" | "userSession">, input: { tokenId: string; userId: string; email: string; passwordHash: string }, now = new Date()) {
  const claimed = await tx.passwordResetToken.updateMany({
    where: { id: input.tokenId, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now },
  });
  if (claimed.count !== 1) return false;
  await tx.user.update({ where: { id: input.userId }, data: { passwordHash: input.passwordHash, mustChangePassword: false, passwordChangedAt: now } });
  await tx.userSession.deleteMany({ where: { userId: input.userId } });
  await tx.passwordResetToken.deleteMany({ where: {
    id: { not: input.tokenId }, usedAt: null,
    OR: [{ userId: input.userId }, ...(input.email ? [{ email: input.email }] : [])],
  } });
  return true;
}
