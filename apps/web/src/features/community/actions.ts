"use server";
import { revalidatePath } from "next/cache";
import { requireOrgRole, requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { getGuestStay } from "@/features/bnb/guest/session";
import { publishCommunityNotice } from "./service";
export type NoticeState = { error?: string; message?: string };
export async function publishNoticeAction(_state: NoticeState, form: FormData): Promise<NoticeState> {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
  const orgId = session.activeOrgId!;
  const rate = await checkRateLimit({ key: `community-publish:${orgId}:${session.userId}`, limit: 20, windowMs: 3600000 });
  if (!rate.allowed) return { error: "Too many notices. Please wait before publishing again." };
  try {
    const result = await publishCommunityNotice(orgId, session.userId, Object.fromEntries(form));
    await writeAuditLog({ orgId, actorUserId: session.userId, action: "COMMUNITY_NOTICE_PUBLISHED", entityType: "CommunityNotice", entityId: result.id, metadata: { recipients: result.recipients } });
    revalidatePath("/dashboard/org/community"); revalidatePath("/dashboard/tenant/community"); revalidatePath("/dashboard/tenant/notices"); revalidatePath("/guest-stay");
    return { message: result.targeted
      ? "Official notice sent to the selected tenant."
      : `Official notice published and delivered to ${result.recipients} current occupant account(s).` };
  } catch (error) { return { error: error instanceof Error && error.name !== "ZodError" ? error.message : "Check the property, title, and notice message." }; }
}
export async function acknowledgeNotice(_state: NoticeState, form: FormData): Promise<NoticeState> {
  const guest = form.get("guest") === "1";
  const id = String(form.get("id"));
  if (guest) {
    const stay = await getGuestStay();
    if (!stay) return { error: "Your guest access has expired." };
    await prisma.communityNoticeRecipient.updateMany({ where: { id, reservationId: stay.id, notice: { orgId: stay.listing.orgId } }, data: { readAt: new Date() } });
    revalidatePath("/guest-stay");
  } else {
    const session = await requireTenantAccess();
    const tenant = await prisma.tenant.findFirst({ where: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null }, select: { id: true } });
    if (!tenant) return { error: "Tenant profile not found." };
    await prisma.communityNoticeRecipient.updateMany({ where: { id, tenantId: tenant.id, notice: { orgId: session.activeOrgId! } }, data: { readAt: new Date() } });
    revalidatePath("/dashboard/tenant/community");
  }
  return { message: "Marked as read." };
}
