import "server-only";
import { prisma } from "@/lib/prisma";
import { getDeviceLabel } from "@/features/security/_lib/helpers";

export const accountSecurityLabels = {
  ACCOUNT_SIGNED_IN: "Signed in",
  ACCOUNT_SIGNED_OUT: "Signed out",
  ACCOUNT_PASSWORD_CHANGED: "Password changed and other devices signed out",
  ACCOUNT_PASSWORD_RESET: "Password reset completed",
  PASSWORD_CHANGE_REJECTED: "Password change was not verified",
  SESSION_REVOKED: "A device session was revoked",
  OTHER_SESSIONS_REVOKED: "Other devices were signed out",
} as const;
export type AccountSecurityEvent = keyof typeof accountSecurityLabels;

export async function recordAccountSecurityEvent(input: { userId: string; action: AccountSecurityEvent; ip?: string | null; userAgent?: string | null }) {
  try {
    await prisma.auditLog.create({ data: { orgId: null, actorUserId: input.userId, action: input.action, entityType: "User", entityId: input.userId, ip: input.ip ?? null, userAgent: input.userAgent ?? null } });
  } catch { console.error("Account security history could not be recorded", { action: input.action }); }
}

export async function getAccountSecurityActivity(userId: string) {
  const [user, events] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordChangedAt: true } }),
    prisma.auditLog.findMany({ where: { actorUserId: userId, OR: [
      { entityType: "User", entityId: userId, action: { in: Object.keys(accountSecurityLabels) } },
      { entityType: "UserSession", action: "SESSION_REVOKED", metadata: { path: ["scope"], equals: "self-service" } },
    ] }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 25, select: { id: true, action: true, createdAt: true, ip: true, userAgent: true } }),
  ]);
  return { passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null, events: events.map(event => ({ id: event.id, label: accountSecurityLabels[event.action as AccountSecurityEvent], createdAt: event.createdAt.toISOString(), ip: event.ip, device: getDeviceLabel(event.userAgent) })) };
}
