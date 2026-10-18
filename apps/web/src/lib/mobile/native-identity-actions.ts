import "server-only";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionField, NativeActionLink } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { nativeOrgWideAccess } from "./native-workspace-policy";
import { requestIdentityVerification, reviewIdentityVerification, linkApprovedIdentity } from "@/features/identity/actions";

function identityPath(kind: "organization" | "platform", path: string) {
  return kind === "platform" ? path === "/platform/identity-verification"
    : ["/dashboard/org/identity-verification", "/dashboard/org/verify-tenant"].includes(path);
}
function organizationAccess(session: AppSession) {
  return !!session.activeOrgId && ["ADMIN", "MANAGER", "OFFICE"].includes(session.activeOrgRole ?? "") && nativeOrgWideAccess(session.membershipScope);
}
const field = (name: string, label: string, extra: Partial<NativeActionField> = {}): NativeActionField => ({ name, label, type: "text", ...extra });

export function nativeIdentityPageActions(session: AppSession, kind: "organization" | "platform", path: string): NativeActionLink[] {
  return kind === "organization" && identityPath(kind, path) && organizationAccess(session)
    ? [{ id: "identity.request", title: "Request ID verification" }] : [];
}
export function nativeIdentityRecordActions(kind: "organization" | "platform", path: string, status?: string): NativeActionLink[] {
  if (!identityPath(kind, path)) return [];
  if (kind === "platform" && status === "PENDING") return [{ id: "identity.review", title: "Review identity and consent" }];
  if (kind === "organization" && status === "APPROVED") return [{ id: "identity.link", title: "Link verified account" }];
  return [];
}

export async function nativeIdentityActionDefinition(session: AppSession, kind: "organization" | "platform", path: string, actionId: string, recordId?: string): Promise<NativeActionDefinition | null> {
  if (!identityPath(kind, path)) return null;
  if (kind === "platform" ? !["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole) : !organizationAccess(session)) return null;
  if (actionId === "identity.request" && kind === "organization" && !recordId) {
    const roles = session.activeOrgRole === "ADMIN" ? ["TENANT", "LANDLORD", "CARETAKER", "OFFICE", "MANAGER", "ACCOUNTANT"] : ["TENANT", "LANDLORD"];
    return { id: actionId, title: "Request ID verification", description: "Ask the platform to authenticate a registered person's ID and consent before linking their existing account. Their password and records in other organizations are preserved.", submitLabel: "Send verification request", confirmation: "Send this applicant's information to the platform for identity verification?", groups: [{ id: "applicant", title: "Applicant and registration", fields: [
      field("number", "Registered national ID number", { required: true, maxLength: 40 }),
      field("fullName", "Applicant's full name", { required: true, maxLength: 120 }),
      field("phone", "Applicant's phone", { type: "phone", required: true, maxLength: 30 }),
      field("email", "Applicant's email (optional)", { type: "email", maxLength: 254 }),
      field("requestedRole", "Registration role", { type: "select", required: true, defaultValue: "TENANT", options: roles.map(value => ({ value, label: value })) }),
      field("reason", "Reason and identity evidence (at least 20 characters)", { type: "multiline", required: true, maxLength: 3000 }),
    ] }] };
  }
  if (!recordId || !["identity.review", "identity.link"].includes(actionId)) return null;
  const request = await prisma.identityVerificationRequest.findFirst({ where: { id: recordId, ...(kind === "organization" ? { orgId: session.activeOrgId! } : {}) }, select: { fullName: true, requestedRole: true, status: true } });
  if (!request) return null;
  if (actionId === "identity.review" && kind === "platform" && request.status === "PENDING") return {
    id: actionId, title: "Authenticate registered ID", description: `Review ${request.fullName}'s identity, registered ownership and consent. Approval links the existing person's account; it does not create another account with the same ID.`, submitLabel: "Save authentication decision", confirmation: "Save this identity verification decision and its evidence?", groups: [{ id: "decision", title: "Authentication decision", fields: [
      field("status", "Decision", { type: "select", required: true, defaultValue: "REJECTED", options: [{ value: "REJECTED", label: "Reject / verification unsuccessful" }, { value: "APPROVED", label: "Approve existing-account link" }] }),
      field("reviewNotes", "Authentication evidence and decision notes (at least 20 characters)", { type: "multiline", required: true, maxLength: 3000 }),
      field("identityConfirmed", "I authenticated this person's ID and consent to link their existing account to this organization", { type: "checkbox" }),
    ] }],
  };
  if (actionId === "identity.link" && kind === "organization" && request.status === "APPROVED" && (["TENANT", "LANDLORD"].includes(request.requestedRole) || session.activeOrgRole === "ADMIN")) return {
    id: actionId, title: "Link verified account", description: `${request.fullName} will use their existing login as ${request.requestedRole}. Unit allocation and staff assignments are managed separately after linking.`, submitLabel: "Link verified account", confirmation: "Link this platform-approved account to your organization? No new password will be created.", groups: [],
  };
  return null;
}

/** The web transactions recheck identity ownership, current status, consent and authorization. */
export async function executeNativeIdentityAction(kind: "organization" | "platform", actionId: string, recordId: string | undefined, form: FormData) {
  if (actionId === "identity.request" && kind === "organization") return requestIdentityVerification({}, form);
  if (!recordId) throw new Error("Choose a verification request.");
  form.set("requestId", recordId);
  if (actionId === "identity.review" && kind === "platform") return reviewIdentityVerification({}, form);
  if (actionId === "identity.link" && kind === "organization") return linkApprovedIdentity({}, form);
  throw new Error("This identity action is unavailable.");
}
