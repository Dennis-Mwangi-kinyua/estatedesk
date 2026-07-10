"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

const BROADCASTS_PATH = "/dashboard/caretaker/broadcasts";

async function requireCaretakerBroadcastContext() {
  const session = await requireUserSession();

  if (!session.activeOrgId || session.activeOrgRole !== "CARETAKER") {
    throw new Error("Caretaker access is required.");
  }

  return session;
}

export async function markCaretakerBroadcastReadAction(formData: FormData) {
  const session = await requireCaretakerBroadcastContext();
  const notificationId = String(formData.get("notificationId") ?? "").trim();

  if (!notificationId) return;

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      orgId: session.activeOrgId!,
      userId: session.userId,
      type: "GENERAL",
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidatePath(BROADCASTS_PATH);
}