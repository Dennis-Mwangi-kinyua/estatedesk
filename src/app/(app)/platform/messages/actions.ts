"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireMessageAccess() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
}

export async function markPlatformMessageReadAction(formData: FormData) {
  await requireMessageAccess();
  const messageId = formText(formData, "messageId");
  if (!messageId) return;

  await prisma.platformMessage.updateMany({
    where: { id: messageId },
    data: { status: "READ" },
  });

  revalidatePath("/platform/messages");
}

export async function markPlatformMessageSpamAction(formData: FormData) {
  await requireMessageAccess();
  const messageId = formText(formData, "messageId");
  if (!messageId) return;

  await prisma.platformMessage.updateMany({
    where: { id: messageId },
    data: { status: "SPAM" },
  });

  revalidatePath("/platform/messages");
}

export async function deletePlatformMessageAction(formData: FormData) {
  await requireMessageAccess();
  const messageId = formText(formData, "messageId");
  if (!messageId) return;

  await prisma.platformMessage.deleteMany({
    where: { id: messageId },
  });

  revalidatePath("/platform/messages");
}
