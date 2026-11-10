import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashOpaqueToken } from "@/lib/crypto/tokens";
import { recordAccountSecurityEvent } from "@/lib/security/account-events";
import { accountPasswordSchema } from "./password-policy";

export class AccountPasswordError extends Error {}
/** Called only with the authenticated user's current live session, never a submitted user ID. */
export async function changeAccountPassword(input: { userId: string; sessionId: string; values: unknown; acceptTermsVersion?: string }, now = new Date()) {
  const parsed = accountPasswordSchema.safeParse(input.values);
  if (!parsed.success) throw new AccountPasswordError(parsed.error.issues[0]?.message ?? "Check the password fields.");
  const values = parsed.data;
  // bcrypt only distinguishes the first 72 UTF-8 bytes; reject truncation.
  if (Buffer.byteLength(values.newPassword, "utf8") > 72) throw new AccountPasswordError("Your new password exceeds 72 UTF-8 bytes. Use a shorter passphrase.");
  const limit = await checkRateLimit({ key: `account-password:${input.userId}`, limit: 5, windowMs: 15 * 60_000 });
  if (!limit.allowed) throw new AccountPasswordError("Too many password attempts. Wait 15 minutes and try again.");
  const [user, current] = await Promise.all([
    prisma.user.findFirst({ where: { id: input.userId, status: "ACTIVE", deletedAt: null }, select: { id: true, email: true, passwordHash: true } }),
    prisma.userSession.findFirst({ where: { id: input.sessionId, userId: input.userId, expiresAt: { gt: now } }, select: { id: true, tokenHash: true, expiresAt: true, ipAddress: true, userAgent: true } }),
  ]);
  if (!user || !current) throw new AccountPasswordError("Please sign in again before changing your password.");
  if (!await bcrypt.compare(values.currentPassword, user.passwordHash)) {
    await recordAccountSecurityEvent({ userId: user.id, action: "PASSWORD_CHANGE_REJECTED", ip: current.ipAddress, userAgent: current.userAgent });
    throw new AccountPasswordError("Current password is incorrect.");
  }
  if (await bcrypt.compare(values.newPassword, user.passwordHash)) throw new AccountPasswordError("Choose a different password from your current one.");
  const passwordHash = await bcrypt.hash(values.newPassword, 12);
  const token = randomBytes(32).toString("hex");
  await prisma.$transaction(async tx => {
    const live = await tx.userSession.findFirst({ where: { id: current.id, userId: user.id, tokenHash: current.tokenHash, expiresAt: { gt: new Date() } }, select: { id: true } });
    if (!live) throw new AccountPasswordError("Your session changed. Sign in again and retry.");
    const updated = await tx.user.updateMany({ where: { id: user.id, passwordHash: user.passwordHash, status: "ACTIVE", deletedAt: null }, data: { passwordHash, passwordChangedAt: now, mustChangePassword: false, ...(input.acceptTermsVersion ? { termsAcceptedAt: now, termsAcceptedVersion: input.acceptTermsVersion } : {}) } });
    if (updated.count !== 1) throw new AccountPasswordError("Your password changed in another request. Sign in again.");
    await tx.userSession.update({ where: { id: current.id }, data: { tokenHash: hashOpaqueToken(token, "session"), lastSeenAt: now } });
    await tx.userSession.deleteMany({ where: { userId: user.id, id: { not: current.id } } });
    await tx.passwordResetToken.deleteMany({ where: { OR: [{ userId: user.id }, ...(user.email ? [{ email: user.email }] : [])] } });
    await tx.auditLog.create({ data: { orgId: null, actorUserId: user.id, action: "ACCOUNT_PASSWORD_CHANGED", entityType: "User", entityId: user.id, ip: current.ipAddress, userAgent: current.userAgent } });
  });
  // Raw credentials stay server-side; callers commit the signed cookie or use the guarded native transport.
  return { token, expiresAt: current.expiresAt };
}
