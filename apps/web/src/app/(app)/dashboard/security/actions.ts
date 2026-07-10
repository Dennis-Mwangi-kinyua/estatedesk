"use server";

import { revalidatePath } from "next/cache";
import {
  requireUserSession,
  revokeOtherUserSession,
  revokeOtherUserSessions,
} from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/security";

const SECURITY_PATHS = [
  "/dashboard/security",
  "/dashboard/caretaker/security",
  "/dashboard/org/security",
] as const;

export async function revokeSessionAction(formData: FormData) {
  const session = await requireUserSession();
  const sessionId = String(formData.get("sessionId") ?? "");

  if (!sessionId) {
    return;
  }

  const revoked = await revokeOtherUserSession({
    userId: session.userId,
    sessionId,
  });

  if (revoked) {
    await writeAuditLog({
      orgId: session.activeOrgId,
      actorUserId: session.userId,
      action: "SESSION_REVOKED",
      entityType: "UserSession",
      entityId: sessionId,
      metadata: {
        scope: "self-service",
      },
    });
  }

  for (const path of SECURITY_PATHS) {
    revalidatePath(path);
  }
}

export async function revokeOtherSessionsAction() {
  const session = await requireUserSession();
  const revokedCount = await revokeOtherUserSessions(session.userId);

  if (revokedCount > 0) {
    await writeAuditLog({
      orgId: session.activeOrgId,
      actorUserId: session.userId,
      action: "OTHER_SESSIONS_REVOKED",
      entityType: "User",
      entityId: session.userId,
      metadata: {
        scope: "self-service",
        revokedCount,
      },
    });
  }

  for (const path of SECURITY_PATHS) {
    revalidatePath(path);
  }
}
