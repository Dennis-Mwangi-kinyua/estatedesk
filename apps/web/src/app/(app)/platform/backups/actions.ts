"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { sendSecurityAlert } from "@/lib/security/alerts";
import { updatePlatformControl } from "@/lib/platform/control";

const PAGE = "/platform/backups";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function recordBackupCheckpointAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const note = readString(formData, "note");
  const status = readString(formData, "status");
  if (!["Ready", "Review", "Failed"].includes(status) || note.length < 10 || note.length > 2000) {
    redirect(`${PAGE}?error=invalid-evidence`);
  }

  await updatePlatformControl(
    {
      lastBackupAt: new Date(),
      lastBackupNote: note,
      lastBackupStatus: status,
    },
    session.userId,
  );

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_BACKUP_CHECKPOINT_RECORDED",
    entityType: "PlatformControl",
    entityId: "global",
    metadata: { note, status },
  });

  await sendSecurityAlert({
    event: "PLATFORM_BACKUP_CHECKPOINT_RECORDED",
    severity: "info",
    actorUserId: session.userId,
    summary: `${session.fullName} recorded a backup checkpoint: ${status}`,
    metadata: { note },
  });

  revalidatePath(PAGE);
  redirect(`${PAGE}?ok=checkpoint`);
}

export async function markRestoreDrillAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const note = readString(formData, "note");
  if (note.length < 10 || note.length > 2000) {
    redirect(`${PAGE}?error=invalid-evidence`);
  }

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_RESTORE_DRILL_RECORDED",
    entityType: "PlatformControl",
    entityId: "global",
    metadata: { note },
  });

  revalidatePath(PAGE);
  redirect(`${PAGE}?ok=restore-drill`);
}
