import "server-only";

import type { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";
import { buildPersonalUnreadNotificationWhere } from "./unread-count-query";

export { buildPersonalUnreadNotificationWhere } from "./unread-count-query";

export async function getPersonalUnreadNotificationCount(input: {
  orgId: string;
  userId: string;
  orgRole: OrgRole | null;
  tenantId?: string | null;
}) {
  return prisma.notification.count({
    where: buildPersonalUnreadNotificationWhere(input),
  });
}

export async function resolveUnreadBadgeCount(session: AppSession) {
  if (!session.activeOrgId) {
    return 0;
  }

  let tenantId: string | null = null;

  if (session.activeOrgRole === "TENANT") {
    const tenant = await prisma.tenant.findFirst({
      where: {
        orgId: session.activeOrgId,
        userId: session.userId,
        deletedAt: null,
      },
      select: { id: true },
    });
    tenantId = tenant?.id ?? null;
  }

  return getPersonalUnreadNotificationCount({
    orgId: session.activeOrgId,
    userId: session.userId,
    orgRole: session.activeOrgRole,
    tenantId,
  });
}