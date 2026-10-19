import "server-only";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionLink } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { nativeOrgWideAccess, nativeUnitScope } from "./native-workspace-policy";
import { approveIssueResolutionReportAction, rejectIssueResolutionReportAction } from "@/app/(app)/dashboard/org/issues/actions";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export function nativeResolutionActions(status?: string): NativeActionLink[] {
  return status === "SUBMITTED" ? [{ id: "resolution.approve", title: "Approve and send to tenant" }, { id: "resolution.reject", title: "Return for more work" }] : [];
}
export async function nativeResolutionDefinition(session: AppSession, path: string, actionId: string, recordId?: string): Promise<NativeActionDefinition | null> {
  if (path !== "/dashboard/org/issues/resolution-reports" || !recordId || !session.activeOrgId || !["ADMIN", "MANAGER", "OFFICE"].includes(session.activeOrgRole ?? "")) return null;
  const action = nativeResolutionActions("SUBMITTED").find(item => item.id === actionId);
  if (!action) return null;
  const row = await prisma.issueResolutionReport.findFirst({ where: { id: recordId, orgId: session.activeOrgId, status: "SUBMITTED", ...(nativeOrgWideAccess(session.membershipScope) ? {} : { issue: { unit: nativeUnitScope(session.activeOrgId, session.membershipScope) } }) }, select: { issueId: true, workSummary: true, updatedAt: true } });
  if (!row) return null;
  return { id: actionId, title: action.title, description: row.workSummary, submitLabel: action.title, confirmation: `${action.title}?`, groups: [{ id: "review", title: "Review completion report", fields: [
    { name: "issueId", label: "Issue", type: "hidden", defaultValue: row.issueId, required: true },
    { name: "expectedUpdatedAt", label: "Report version", type: "hidden", defaultValue: row.updatedAt.toISOString(), required: true },
    { name: "officeNotes", label: actionId === "resolution.reject" ? "What should the caretaker fix?" : "Office note for tenant", type: "multiline", required: actionId === "resolution.reject", maxLength: 5000 },
  ] }] };
}
export async function executeNativeResolutionAction(session: AppSession, path: string, actionId: string, recordId: string | undefined, form: FormData) {
  const current = await nativeResolutionDefinition(session, path, actionId, recordId);
  if (!current) throw new Error("This report is no longer available for review.");
  const fields = current.groups[0].fields;
  if (form.get("expectedUpdatedAt") !== fields.find(field => field.name === "expectedUpdatedAt")?.defaultValue || form.get("issueId") !== fields.find(field => field.name === "issueId")?.defaultValue) throw new Error("The report changed. Refresh and review it again.");
  form.set("reportId", recordId!); form.set("returnTo", "queue");
  try { await (actionId === "resolution.approve" ? approveIssueResolutionReportAction : rejectIssueResolutionReportAction)(form); }
  catch (cause) { if (!isRedirectError(cause)) throw cause; }
  const saved = await prisma.issueResolutionReport.findFirst({ where: { id: recordId, orgId: session.activeOrgId!, status: actionId === "resolution.approve" ? "OFFICE_APPROVED" : "REJECTED", officeReviewedByUserId: session.userId }, select: { id: true } });
  if (!saved) throw new Error("The review was not saved. Refresh before trying again.");
  return { ok: true as const, message: actionId === "resolution.approve" ? "Completion report approved and sent to tenant." : "Completion report returned for more work." };
}
