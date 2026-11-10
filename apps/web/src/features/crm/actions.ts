"use server";

import { requireOrgCrmAccess } from "@/features/crm/access";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { safeServerActionError } from "@/lib/errors/server-error-log";
import { leadSchema, dealSchema, activitySchema, tenantCrmWhere } from "./policy";

export type CrmState = { ok: boolean; message: string };
const platformAccess = () => requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
const value = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
function refresh() {
  revalidatePath("/platform/crm", "layout");
  revalidatePath("/dashboard/org/crm", "layout");
  revalidatePath("/platform/marketing");
  revalidatePath("/platform/onboarding");
}
async function validPlatformOwner(id: string) {
  return !id || !!await prisma.user.findFirst({ where: { id, status: "ACTIVE", deletedAt: null, platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] } }, select: { id: true } });
}
export async function createSalesLead(_state: CrmState, form: FormData): Promise<CrmState> {
  const session = await platformAccess();
  const parsed = leadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  try {
    await prisma.$transaction(async tx => {
      const lead = await tx.onboardingRequest.create({ data: { ...parsed.data, source: "CRM_MANUAL", salesOwnerId: session.userId } });
      await tx.crmActivity.create({ data: { leadId: lead.id, authorId: session.userId, kind: "CHANGE", body: "Prospect created." } });
    });
    refresh(); return { ok: true, message: "Prospect added to the pipeline." };
  } catch (e) { return { ok: false, message: safeServerActionError("crm.create", e, "Could not create prospect.") }; }
}
export async function updateSalesLead(_state: CrmState, form: FormData): Promise<CrmState> {
  const session = await platformAccess();
  const id = value(form, "leadId");
  const parsed = dealSchema.safeParse(Object.fromEntries(form));
  if (!id || !parsed.success) return { ok: false, message: parsed.success ? "Missing lead." : parsed.error.issues[0].message };
  const data = parsed.data;
  try {
    if (!await validPlatformOwner(data.salesOwnerId)) return { ok: false, message: "Choose an active platform administrator." };
    if (data.customerOrgId && !await prisma.organization.findFirst({ where: { id: data.customerOrgId, deletedAt: null }, select: { id: true } })) return { ok: false, message: "Customer organization is unavailable." };
    await prisma.$transaction(async tx => {
      const previous = await tx.onboardingRequest.findUniqueOrThrow({ where: { id }, select: { demoAt: true } });
      const result = await tx.onboardingRequest.updateMany({
        where: { id, updatedAt: new Date(data.updatedAt) }, data: {
          salesStage: data.salesStage, salesOwnerId: data.salesOwnerId || null, customerOrgId: data.customerOrgId || null,
          expectedMonthlyValue: data.expectedMonthlyValue === "" ? null : data.expectedMonthlyValue,
          currencyCode: data.currencyCode, targetPlan: data.targetPlan || null, demoAt: data.demoAt ? new Date(data.demoAt) : null,
          lostReason: data.salesStage === "LOST" ? data.lostReason : null,
        }
      });
      if (result.count !== 1) throw new Error("CRM_CONFLICT");
      const demoAt = data.demoAt ? new Date(data.demoAt) : null;
      if (demoAt?.getTime() !== previous.demoAt?.getTime()) {
        await tx.crmActivity.updateMany({ where: { leadId: id, kind: "DEMO", subject: "Sales demo", completedAt: null }, data: { dueAt: null, body: `Demo appointment replaced or cancelled (previously ${previous.demoAt?.toISOString() ?? "unscheduled"}).` } });
        if (demoAt) await tx.crmActivity.create({ data: { leadId: id, authorId: session.userId, assigneeId: data.salesOwnerId || null, kind: "DEMO", subject: "Sales demo", body: "Scheduled sales demonstration", dueAt: demoAt } });
      }
      await tx.crmActivity.updateMany({ where: { leadId: id, kind: "DEMO", subject: "Sales demo", completedAt: null }, data: { assigneeId: data.salesOwnerId || null } });
      await tx.crmActivity.create({ data: { leadId: id, authorId: session.userId, kind: "CHANGE", body: `Deal saved: ${data.salesStage}. Plan: ${data.targetPlan || "unset"}. Monthly value: ${data.currencyCode} ${data.expectedMonthlyValue === "" ? "unset" : data.expectedMonthlyValue}. Demo: ${data.demoAt || "unset"}.${data.lostReason ? ` Lost reason: ${data.lostReason}` : ""}` } });
    });
    refresh(); return { ok: true, message: "Deal saved." };
  } catch (e) { return { ok: false, message: e instanceof Error && e.message === "CRM_CONFLICT" ? "This deal changed. Refresh the page before saving again." : safeServerActionError("crm.update", e, "Could not save deal.") }; }
}
async function targetAccess(form: FormData) {
  const target = value(form, "target"); const id = value(form, "targetId");
  if (!id) throw new Error("Missing customer.");
  if (target === "tenant") {
    const session = await requireOrgCrmAccess();
    const orgId = session.activeOrgId!;
    const tenant = await prisma.tenant.findFirst({ where: { ...tenantCrmWhere(orgId, session.membershipScope), id }, select: { id: true } });
    if (!tenant) throw new Error("Customer unavailable.");
    return { session, where: { tenantId: id, scopeOrgId: orgId }, orgId };
  }
  const session = await platformAccess();
  if (target === "lead" && await prisma.onboardingRequest.findUnique({ where: { id }, select: { id: true } })) return { session, where: { leadId: id, scopeOrgId: null }, orgId: null };
  if (target === "organization" && await prisma.organization.findFirst({ where: { id, deletedAt: null }, select: { id: true } })) return { session, where: { customerOrgId: id, scopeOrgId: null }, orgId: null };
  throw new Error("Customer unavailable.");
}
export async function addCrmActivity(_state: CrmState, form: FormData): Promise<CrmState> {
  const access = await targetAccess(form);
  const parsed = activitySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const data = parsed.data;
  try {
    if (data.assigneeId) {
      const allowed = access.orgId
        ? await prisma.membership.findFirst({ where: { orgId: access.orgId, userId: data.assigneeId, role: { in: ["ADMIN", "MANAGER", "OFFICE"] }, employmentEndedAt: null, deactivatedAt: null, scopeType: "ORG", user: { status: "ACTIVE", deletedAt: null } }, select: { id: true } })
        : await validPlatformOwner(data.assigneeId);
      if (!allowed) return { ok: false, message: "Choose an active administrator or office staff member with organization-wide access." };
    }
    await prisma.crmActivity.create({ data: { ...access.where, authorId: access.session.userId, assigneeId: data.assigneeId || null, kind: data.kind, priority: data.priority, body: data.body, dueAt: data.dueAt ? new Date(data.dueAt) : null } });
    refresh(); return { ok: true, message: "Activity recorded." };
  } catch (e) { return { ok: false, message: safeServerActionError("crm.activity", e, "Could not record activity.") }; }
}
export async function completeCrmActivity(_state: CrmState, form: FormData): Promise<CrmState> {
  const access = await targetAccess(form);
  try {
    const completed = await prisma.$transaction(async tx => {
      const result = await tx.crmActivity.updateMany({ where: { ...access.where, id: value(form, "activityId"), completedAt: null, dueAt: { not: null } }, data: { completedAt: new Date() } });
      if (result.count) await tx.crmActivity.create({ data: { ...access.where, authorId: access.session.userId, kind: "CHANGE", body: "Follow-up completed." } });
      return result.count;
    });
    if (!completed) return { ok: false, message: "This follow-up is already completed or unavailable." };
    refresh(); return { ok: true, message: "Follow-up completed." };
  } catch (e) { return { ok: false, message: safeServerActionError("crm.complete", e, "Could not complete follow-up.") }; }
}

export async function sendCrmMessage(_state: CrmState, form: FormData): Promise<CrmState> {
  const access = await targetAccess(form);
  const subject = value(form, "subject"); const body = value(form, "body");
  const channel = value(form, "channel"); const requestKey = value(form, "requestKey");
  if (!subject || subject.length > 160 || !body || body.length > 4000 || !/^[0-9a-f-]{36}$/i.test(requestKey) || !["EMAIL", "IN_APP"].includes(channel)) return { ok: false, message: "Provide a subject, message, and valid delivery channel." };
  if (channel === "IN_APP" && !access.orgId) return { ok: false, message: "In-app messages are available for tenant customers." };
  try {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const rate = await checkRateLimit({ key: `crm-message:${access.session.userId}`, limit: 20, windowMs: 15 * 60 * 1000 });
    if (!rate.allowed) return { ok: false, message: "Message limit reached. Try again later." };
    const existing = await prisma.crmActivity.findUnique({ where: { requestKey }, select: { authorId: true, deliveryStatus: true } });
    if (existing) return { ok: existing.authorId === access.session.userId && ["ACCEPTED", "SENT"].includes(existing.deliveryStatus ?? ""), message: existing.authorId === access.session.userId ? `This message was already submitted (${existing.deliveryStatus ?? "pending"}).` : "Message token is unavailable. Refresh the page." };
    let email: string | null = null;
    let tenantUserId: string | null = null;
    if (access.where.tenantId) { const t = await prisma.tenant.findUniqueOrThrow({ where: { id: access.where.tenantId }, select: { email: true, userId: true } }); email = t.email; tenantUserId = t.userId; }
    if (access.where.leadId) email = (await prisma.onboardingRequest.findUniqueOrThrow({ where: { id: access.where.leadId }, select: { workEmail: true } })).workEmail;
    if (access.where.customerOrgId) email = (await prisma.organization.findUniqueOrThrow({ where: { id: access.where.customerOrgId }, select: { email: true } })).email;
    if (channel === "IN_APP") {
      if (!tenantUserId) return { ok: false, message: "This customer does not have a linked portal account. Use email instead." };
      await prisma.$transaction(async tx => {
        await tx.crmActivity.create({ data: { ...access.where, authorId: access.session.userId, kind: "NOTE", subject, body, requestKey, deliveryStatus: "SENT" } });
        await tx.notification.create({ data: { orgId: access.orgId!, tenantId: access.where.tenantId, userId: tenantUserId, channel: "IN_APP", type: "GENERAL", title: subject, message: body, status: "SENT", sentAt: new Date() } });
      });
      refresh(); return { ok: true, message: "Message delivered to the customer portal." };
    }
    if (!email) return { ok: false, message: "This customer has no email address. Update the customer record first." };
    const apiKey = process.env.RESEND_API_KEY?.trim(); const from = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !from) return { ok: false, message: "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM." };
    const activity = await prisma.crmActivity.create({ data: { ...access.where, authorId: access.session.userId, kind: "EMAIL", subject, body, requestKey, deliveryStatus: "PENDING" } });
    try {
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `crm-${activity.id}` }, body: JSON.stringify({ from, to: [email], subject, text: body }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        await prisma.crmActivity.update({ where: { id: activity.id }, data: { deliveryStatus: "FAILED" } });
        refresh(); return { ok: false, message: "The email provider rejected this message. Review delivery settings." };
      }
      await prisma.crmActivity.update({ where: { id: activity.id }, data: { deliveryStatus: "ACCEPTED" } });
      refresh(); return { ok: true, message: "Email accepted by the delivery provider." };
    } catch {
      await prisma.crmActivity.update({ where: { id: activity.id }, data: { deliveryStatus: "UNCONFIRMED" } });
      refresh(); return { ok: false, message: "Email delivery could not be confirmed. Check the provider before sending again." };
    }
  } catch (e) { return { ok: false, message: safeServerActionError("crm.message", e, "Could not submit message. Refresh to check its status.") }; }
}

export async function updateCrmTask(_state: CrmState, form: FormData): Promise<CrmState> {
  const access = await targetAccess(form);
  const parsed = activitySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success || !parsed.data.dueAt) return { ok: false, message: parsed.success ? "Choose a due date." : parsed.error.issues[0].message };
  const data = parsed.data;
  try {
    if (data.assigneeId) {
      const allowed = access.orgId
        ? await prisma.membership.findFirst({ where: { orgId: access.orgId, userId: data.assigneeId, role: { in: ["ADMIN", "MANAGER", "OFFICE"] }, employmentEndedAt: null, deactivatedAt: null, scopeType: "ORG", user: { status: "ACTIVE", deletedAt: null } }, select: { id: true } })
        : await validPlatformOwner(data.assigneeId);
      if (!allowed) return { ok: false, message: "Select an active staff member with access to this workspace." };
    }
    const updated = await prisma.$transaction(async tx => {
      const result = await tx.crmActivity.updateMany({ where: { ...access.where, id: value(form, "activityId"), completedAt: null, dueAt: { not: null }, OR: [{ subject: null }, { subject: { not: "Sales demo" } }] }, data: { body: data.body, priority: data.priority, assigneeId: data.assigneeId || null, dueAt: new Date(data.dueAt) } });
      if (result.count) await tx.crmActivity.create({ data: { ...access.where, authorId: access.session.userId, kind: "CHANGE", body: `Follow-up updated: ${data.body}; due ${data.dueAt}; priority ${data.priority}.` } });
      return result.count;
    });
    if (!updated) return { ok: false, message: "Task unavailable. Reschedule sales demos from the deal details." };
    refresh(); return { ok: true, message: "Task updated." };
  } catch (e) { return { ok: false, message: safeServerActionError("crm.task", e, "Could not update task.") }; }
}

export async function updateLeadContact(_state: CrmState, form: FormData): Promise<CrmState> {
  const session = await platformAccess();
  const parsed = leadSchema.safeParse(Object.fromEntries(form));
  const id = value(form, "leadId"); const updatedAt = value(form, "updatedAt");
  if (!parsed.success || !id || !Number.isFinite(Date.parse(updatedAt))) return { ok: false, message: parsed.success ? "Refresh the prospect and try again." : parsed.error.issues[0].message };
  try {
    const updated = await prisma.$transaction(async tx => {
      const result = await tx.onboardingRequest.updateMany({ where: { id, updatedAt: new Date(updatedAt) }, data: parsed.data });
      if (result.count) await tx.crmActivity.create({ data: { leadId: id, authorId: session.userId, kind: "CHANGE", body: "Prospect contact information updated." } });
      return result.count;
    });
    if (!updated) return { ok: false, message: "The prospect changed. Refresh before saving again." };
    refresh(); return { ok: true, message: "Contact information updated." };
  } catch (e) { return { ok: false, message: safeServerActionError("crm.contact", e, "Could not update contact.") }; }
}

export async function searchCrmOrganizations(query: string) {
  await platformAccess();
  const q = query.trim().slice(0, 160);
  if (q.length < 2) return [];
  return prisma.organization.findMany({ where: { deletedAt: null, OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" }, take: 20 });
}
