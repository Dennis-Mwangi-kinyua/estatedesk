"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import type { SubmitHandoverState } from "./_lib/types";

const HANDOVER_PATH = "/dashboard/caretaker/handover";

export async function submitCaretakerHandoverAction(
  _prevState: SubmitHandoverState,
  formData: FormData,
): Promise<SubmitHandoverState> {
  const session = await requireCaretakerAccess();
  const notes = String(formData.get("notes") ?? "").trim();

  if (notes.length < 10) {
    return {
      error: "Handover notes must be at least 10 characters.",
    };
  }

  if (notes.length > 2000) {
    return {
      error: "Handover notes must be 2000 characters or less.",
    };
  }

  await prisma.auditLog.create({
    data: {
      orgId: session.activeOrgId!,
      actorUserId: session.userId,
      action: "CARETAKER_SHIFT_HANDOVER",
      entityType: "CaretakerShift",
      entityId: session.userId,
      metadata: {
        notes,
        submittedAt: new Date().toISOString(),
      },
    },
  });

  revalidatePath(HANDOVER_PATH);
  return {
    success: "Shift handover submitted to office records.",
  };
}