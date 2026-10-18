import "server-only";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getUserSession, type AppSession } from "@/lib/auth/session";
import { requireOrgMembership } from "@/lib/permissions/guards";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { rolePolicyBlocksPath } from "@/lib/permissions/org-role-policy";
import { getTenantVisitorAccess } from "@/features/visitors/availability";
import { mobileFeatures, advertisedMobileFeatures } from "./features";
export { isNativeRequest } from "./request-policy";

export function mobileJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", Vary: "Cookie, X-EstateDesk-Capabilities" },
  });
}

export async function mobileSession(): Promise<AppSession | Response> {
  const session = await getUserSession();
  if (!session) return mobileJson({ error: "Please sign in again." }, 401);
  // Existing guards check organization status and platform maintenance controls.
  if (session.activeOrgId) await requireOrgMembership();
  return session;
}

export async function sessionSummary(session: AppSession, revision: string | null = null): Promise<MobileSession> {
  const org = session.activeOrgId
    ? await prisma.organization.findUnique({
        where: { id: session.activeOrgId }, select: { name: true, currencyCode: true },
      })
    : null;
  let features = advertisedMobileFeatures(mobileFeatures(session), revision);
  if (features.includes("visitors") && !await getTenantVisitorAccess(session.activeOrgId!, session.userId)) features = features.filter(feature => feature !== "visitors");
  if (features.includes("gate") && !["ADMIN", "MANAGER"].includes(session.activeOrgRole ?? "")) {
    const gate = await prisma.gateAssignment.findFirst({ where: { orgId: session.activeOrgId!, userId: session.userId }, select: { id: true } });
    if (!gate) features = features.filter(feature => feature !== "gate");
  }
  return {
    platformRole: session.platformRole,
    userId: session.userId,
    fullName: session.fullName,
    role: session.activeOrgRole ?? session.platformRole,
    organizationName: org?.name ?? null,
    requiresAccountSetup: session.mustChangePassword || session.requiresTermsAcceptance,
    mustChangePassword: session.mustChangePassword,
    requiresTermsAcceptance: session.requiresTermsAcceptance,
    organizationId: session.activeOrgId,
    currencyCode: org?.currencyCode ?? "KES",
    canViewBills: !rolePolicyBlocksPath(session.orgRolePolicy, "/api/mobile/tenant/bills"),
    features,
  };
}

export function mobileError(error: unknown) {
  if (isRedirectError(error)) {
    return mobileJson({ error: "This workspace is unavailable. Please check your account on the website." }, 403);
  }
  console.error("Mobile API request failed", error);
  return mobileJson({ error: "Unable to complete the request. Please try again." }, 503);
}
