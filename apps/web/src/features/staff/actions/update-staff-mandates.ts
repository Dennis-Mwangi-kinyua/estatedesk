"use server";
import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/permissions/guards";
import { canReceiveOrgMandates, validateOrgMandates } from "@/lib/permissions/role-matrix";
import { prisma } from "@/lib/prisma";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
export async function updateStaffMandates(form: FormData) {
  const session = await requireOrgRole(["ADMIN"]);
  const membershipId = String(form.get("membershipId") ?? "");
  let grants: ReturnType<typeof validateOrgMandates>;
  try { grants = validateOrgMandates(form.getAll("permissions")); } catch { return { ok: false, error: "Choose valid staff permissions." }; }
  const note = String(form.get("note") ?? "").trim();
  if (!note || note.length > 1000) return { ok: false, error: "Add a reason for this change (up to 1,000 characters)." };
  await prisma.$transaction(async tx => {
    const member = await tx.membership.findFirst({ where: { id: membershipId, orgId: session.activeOrgId!, employmentEndedAt: null, deactivatedAt: null, user: { deletedAt: null, status: "ACTIVE" } } });
    if (!member || !canReceiveOrgMandates(member.role)) throw new Error("Choose an active office worker, manager, or accountant in your organisation.");
    await tx.membership.update({ where: { id: member.id }, data: { grantedPermissions: grants } });
    await tx.auditLog.create({ data: { orgId: session.activeOrgId!, actorUserId: session.userId, entityType: "Membership", entityId: member.id, action: "STAFF_MANDATES_UPDATED", metadata: { previous: member.grantedPermissions, granted: grants, note } } });
    await notifyInAppAndPush({ db: tx, orgId: session.activeOrgId!, actorUserId: session.userId, recipients: [{ userId: member.userId }], type: "GENERAL", title: "Your staff permissions have changed", message: `Your organisation admin updated your additional permissions. ${note}`, actionUrl: "/dashboard/org" });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/dashboard/org", "layout");
  revalidatePath("/staff");
  return { ok: true };
}
