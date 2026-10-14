"use server";
import { revalidatePath } from "next/cache";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PRODUCT_UPDATES_DISMISSED_ID, updatesForAudience, type UpdateAudience } from "./catalog";
import type { ProviderActionState } from "@/features/providers/actions";
export async function acknowledgeProductUpdates(_state: ProviderActionState, form: FormData): Promise<ProviderActionState> {
  const session = await requireUserSession();
  const audience = form.get("audience") as UpdateAudience;
  const isPlatform = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole);
  const provider = audience === "PROVIDER" ? await prisma.serviceProvider.findFirst({ where: { userId: session.userId, status: { in: ["ACTIVE", "FLAGGED"] } }, select: { id: true } }) : null;
  const allowed = audience === "PROVIDER" ? Boolean(provider) : isPlatform ? audience === session.platformRole : audience === session.activeOrgRole;
  if (!allowed) return { error: "These updates are not available for your account role." };
  const ids = [PRODUCT_UPDATES_DISMISSED_ID, ...updatesForAudience(audience).map(update => update.id)];
  try {
    await prisma.productUpdateRead.createMany({ data: ids.map(updateId => ({ userId: session.userId, updateId })), skipDuplicates: true });
  } catch (error) {
    console.error("[ProductUpdates] dismissal could not be saved", error);
    return { error: "Could not save your dismissal. Please try closing again." };
  }
  revalidatePath("/", "layout");
  return { message: "Updates dismissed permanently." };
}
