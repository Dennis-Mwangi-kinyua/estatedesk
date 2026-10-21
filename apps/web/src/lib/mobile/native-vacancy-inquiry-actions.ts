import "server-only";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { updateVacancyInquiryStatusAction } from "@/app/(app)/dashboard/org/vacancy-inquiries/actions";

const statuses = ["NEW", "CONTACTED", "VIEWING_SCHEDULED", "CONVERTED", "CLOSED"] as const;
const allowed = (session: AppSession) => !!session.activeOrgId && ["ADMIN", "MANAGER", "OFFICE"].includes(session.activeOrgRole ?? "");

export async function nativeVacancyInquiryDefinition(session: AppSession, path: string, actionId: string, id?: string): Promise<NativeActionDefinition | null> {
  if (path !== "/dashboard/org/vacancy-inquiries" || actionId !== "vacancy-inquiry.status" || !id || !allowed(session)) return null;
  const inquiry = await prisma.vacancyInquiry.findFirst({ where: { id, orgId: session.activeOrgId! }, select: { id: true, fullName: true, status: true } });
  if (!inquiry) return null;
  return { id: actionId, title: "Update inquiry status", description: "Follow up with " + inquiry.fullName + ".", submitLabel: "Save status", confirmation: "Update this inquiry from " + inquiry.status.replaceAll("_", " ").toLowerCase() + "?", groups: [{ id: "status", title: "Follow-up", fields: [{ name: "status", label: "Status", type: "select", required: true, defaultValue: inquiry.status, options: statuses.map(value => ({ value, label: value.replaceAll("_", " ") })) }] }] };
}

export async function executeNativeVacancyInquiryAction(session: AppSession, path: string, actionId: string, id: string | undefined, form: FormData) {
  if (!await nativeVacancyInquiryDefinition(session, path, actionId, id)) return { error: "This inquiry action is unavailable." };
  const status = String(form.get("status") ?? "");
  if (!statuses.includes(status as typeof statuses[number])) return { error: "Choose a valid inquiry status." };
  form.set("inquiryId", id!);
  await updateVacancyInquiryStatusAction(form);
  const inquiry = await prisma.vacancyInquiry.findFirst({ where: { id: id!, orgId: session.activeOrgId! }, select: { status: true } });
  if (!inquiry || inquiry.status !== status) return { error: "The inquiry could not be updated. Refresh the record and try again." };
  return { ok: true as const, message: "Inquiry marked " + status.replaceAll("_", " ").toLowerCase() + "." };
}
