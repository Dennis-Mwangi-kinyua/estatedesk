"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { sendSecurityAlert } from "@/lib/security/alerts";
import { setUserSession } from "@/lib/auth/session";
import {
  SUPPORT_SESSION_MAX_AGE_SECONDS,
  clearSupportSessionCookie,
  getActiveSupportSession,
  setSupportSessionCookie,
} from "@/lib/platform/support-session";

const PAGE = "/platform/support-access";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function enterOrgSupportAccessAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const orgId = readString(formData, "orgId");
  const reason = readString(formData, "reason");
  const hoursRaw = Number(readString(formData, "hours") || "2");
  const hours = Number.isFinite(hoursRaw)
    ? Math.min(8, Math.max(1, Math.floor(hoursRaw)))
    : 2;

  if (!orgId || reason.length < 8) {
    redirect(`${PAGE}?error=support-reason`);
  }

  const org = await prisma.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    select: { id: true, name: true, slug: true, status: true },
  });
  if (!org) redirect(`${PAGE}?error=org-missing`);
  if (org.status !== "ACTIVE") {
    redirect(`${PAGE}?error=org-inactive`);
  }

  let membership = await prisma.membership.findFirst({
    where: {
      orgId: org.id,
      userId: session.userId,
      employmentEndedAt: null,
      deactivatedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    membership = await prisma.membership.create({
      data: {
        orgId: org.id,
        userId: session.userId,
        role: "ADMIN",
        scopeType: "ORG",
        scopeId: "ORG_SCOPE",
        deactivationNotes: `Timed support access: ${reason}`,
      },
    });
  }

  const maxAge = hours * 60 * 60;
  const expiresAtUnix = Math.floor(Date.now() / 1000) + maxAge;

  await setSupportSessionCookie({
    userId: session.userId,
    orgId: org.id,
    orgSlug: org.slug,
    orgName: org.name,
    membershipId: membership.id,
    reason,
    expiresAtUnix,
  });

  await setUserSession({
    userId: session.userId,
    activeMembershipId: membership.id,
    replaceExistingSessions: false,
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_SUPPORT_ORG_ENTER",
    entityType: "Organization",
    entityId: org.id,
    metadata: {
      slug: org.slug,
      reason,
      membershipId: membership.id,
      role: membership.role,
      expiresAtUnix,
      hours,
      source: "support-access",
    },
  });

  await sendSecurityAlert({
    event: "PLATFORM_SUPPORT_ORG_ENTER",
    severity: "critical",
    actorUserId: session.userId,
    entityType: "Organization",
    entityId: org.id,
    summary: `${session.fullName} started a ${hours}h support session in ${org.name}. Reason: ${reason}`,
  });

  redirect("/dashboard/org");
}

export async function leaveOrgSupportAccessAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const support = await getActiveSupportSession(session.userId);
  const returnTo = readString(formData, "returnTo") || "/platform/support-access";

  await clearSupportSessionCookie();

  await setUserSession({
    userId: session.userId,
    activeMembershipId: null,
    replaceExistingSessions: false,
  });

  if (support) {
    await writePlatformAuditLog({
      actorUserId: session.userId,
      action: "PLATFORM_SUPPORT_ORG_LEAVE",
      entityType: "Organization",
      entityId: support.orgId,
      metadata: {
        slug: support.orgSlug,
        reason: support.reason,
        membershipId: support.membershipId,
      },
    });
  }

  revalidatePath("/platform/support-access");
  revalidatePath("/platform/control");
  revalidatePath("/dashboard/org");
  redirect(returnTo.startsWith("/platform") || returnTo.startsWith("/dashboard")
    ? returnTo
    : "/platform/support-access");
}

export async function extendOrgSupportAccessAction() {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const support = await getActiveSupportSession(session.userId);
  if (!support) {
    redirect("/platform/support-access?error=no-support-session");
  }

  const expiresAtUnix =
    Math.floor(Date.now() / 1000) + SUPPORT_SESSION_MAX_AGE_SECONDS;

  await setSupportSessionCookie({
    ...support,
    expiresAtUnix,
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_SUPPORT_ORG_EXTENDED",
    entityType: "Organization",
    entityId: support.orgId,
    metadata: {
      slug: support.orgSlug,
      expiresAtUnix,
    },
  });

  revalidatePath("/dashboard/org");
  redirect("/dashboard/org?support=extended");
}
