"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";

export type PlatformMessageState = {
  ok: boolean;
  message?: string;
};

export async function sendPlatformMessageAction(
  _prevState: PlatformMessageState,
  formData: FormData,
): Promise<PlatformMessageState> {
  const session = await requireManagementAccess();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (subject.length < 3) {
    return { ok: false, message: "Subject is required." };
  }

  if (message.length < 10) {
    return { ok: false, message: "Message must be at least 10 characters." };
  }

  await prisma.platformMessage.create({
    data: {
      orgId: session.activeOrgId!,
      senderUserId: session.userId,
      subject,
      message,
    },
  });

  revalidatePath("/dashboard/org/support");
  revalidatePath("/platform/messages");

  return { ok: true, message: "Message sent to platform support." };
}
