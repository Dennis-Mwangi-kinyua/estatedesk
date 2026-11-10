import "server-only";
import type { Prisma } from "@prisma/client";
import type { TodayItem, TodaySummary } from "@estatedesk/contracts/mobile";
import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { rolePolicyBlocksPath } from "@/lib/permissions/org-role-policy";
import { notificationScopeForSession } from "@/lib/notifications/read";
import { getOperatingQueue } from "@/lib/workflow/operating-queue";
import { getReviewQueue } from "@/lib/workflow/review-queue";
import { tenantCrmWhere } from "@/features/crm/policy";
import { getTenantInvoiceData } from "@/app/(app)/dashboard/tenant/invoice/_lib/queries";
import { nativeTenantSection } from "@/lib/mobile/tenant-section";
import { nativeUnitScope } from "@/lib/mobile/native-workspace-policy";
import { billUrgency, todayUrgency } from "./policy";

const LIMIT = 25;
export async function getTodaySummary(session: AppSession, now = new Date()): Promise<TodaySummary> {
  const orgId = session.activeOrgId;
  const platform = ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole);
  const role = session.activeOrgRole;
  const organization = orgId ? await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, currencyCode: true } }) : null;
  const summary: TodaySummary = { generatedAt: now.toISOString(), timeZone: "Africa/Nairobi", name: session.fullName, workspace: orgId ? organization?.name ?? "Current organization" : platform ? "Platform" : "Your account", sections: [] };
  if (session.mustChangePassword || session.requiresTermsAcceptance) return summary;
  function destination(path: string): TodayItem["native"] {
    const normalized = path === "/dashboard/org/charges/bills" ? "/dashboard/org/charges" : path;
    const supported = new Set(["/dashboard/org/crm/tasks", "/platform/crm/tasks", "/dashboard/org/payments", "/dashboard/org/water-bills", "/dashboard/org/leases", "/dashboard/org/charges", "/dashboard/org/issues", "/dashboard/org/move-outs", "/dashboard/org/service-providers", "/platform/service-providers", "/platform/service-providers/reports", "/platform/data-management"]);
    if (supported.has(normalized) && canAccessWorkspacePath(session, normalized)) {
      return { screen: "workspace", kind: normalized.startsWith("/platform") ? "platform" : "organization", path: normalized };
    }
    return null;
  }
  function add(id: string, title: string, items: TodayItem[], hasMore = false) {
    summary.sections.push({ id, title, items: items.slice(0, LIMIT), hasMore: hasMore || items.length > LIMIT });
  }
  const crmPath = orgId && canAccessWorkspacePath(session, "/dashboard/org/crm") ? "/dashboard/org/crm" : !orgId && platform ? "/platform/crm" : null;
  if (crmPath) {
    const where: Prisma.CrmActivityWhereInput = { assigneeId: session.userId, completedAt: null, dueAt: { not: null }, kind: { in: ["TASK", "DEMO"] }, ...(crmPath.startsWith("/platform") ? { scopeOrgId: null, OR: [{ leadId: { not: null } }, { customerOrg: { deletedAt: null } }] } : { scopeOrgId: orgId, tenant: tenantCrmWhere(orgId!, session.membershipScope) }) };
    const tasks = await prisma.crmActivity.findMany({ where, take: LIMIT + 1, orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }, { id: "asc" }], select: { id: true, body: true, dueAt: true, priority: true, kind: true } });
    add("tasks", "Assigned follow-ups and demos", tasks.map(task => ({ id: `crm:${task.id}`, title: task.body, detail: `${task.kind === "DEMO" ? "Demo" : "Follow-up"} · ${task.priority.toLowerCase()} priority · assigned to you`, action: "Review task", href: `${crmPath}/tasks?mine=yes`, urgency: todayUrgency(task.dueAt, now), dueAt: task.dueAt?.toISOString() ?? null, native: destination(`${crmPath}/tasks`) })));
  }
  if (orgId && (role !== "TENANT" || await nativeTenantSection(session, "/dashboard/tenant/notifications")) && !rolePolicyBlocksPath(session.orgRolePolicy, "/api/mobile/notifications")) {
    const tenant = role === "TENANT" ? await prisma.tenant.findFirst({ where: { orgId, userId: session.userId, deletedAt: null }, select: { id: true } }) : null;
    if (role !== "TENANT" || tenant) {
      const scope = await notificationScopeForSession(session);
      const rows = await prisma.notification.findMany({ where: { ...scope, channel: "IN_APP", status: "SENT", readAt: null }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: LIMIT + 1, select: { id: true, title: true, message: true } });
      const href = role === "TENANT" ? "/dashboard/tenant/notifications" : role === "CARETAKER" ? "/dashboard/caretaker/notifications" : "/dashboard/org/notifications";
      if (!rolePolicyBlocksPath(session.orgRolePolicy, href)) add("messages", "Unread messages", rows.map(row => ({ id: `message:${row.id}`, title: row.title, detail: row.message, href: canAccessWorkspacePath(session, href) ? href : "/dashboard/today#messages", action: "Read message", urgency: "normal", dueAt: null, native: { screen: "notifications" } })));
    }
  }
  if (orgId && role === "TENANT" && canAccessWorkspacePath(session, "/dashboard/tenant/invoice") && !rolePolicyBlocksPath(session.orgRolePolicy, "/api/mobile/tenant/bills")) {
    const lease = await prisma.lease.findFirst({ where: { orgId, status: "ACTIVE", deletedAt: null, tenant: { userId: session.userId, deletedAt: null } }, select: { id: true } });
    if (lease) {
      const data = await getTenantInvoiceData(session.userId, orgId, session.fullName);
      summary.workspace = data.organizationName;

      const bills = data.bills.filter(bill => bill.balance > 0).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      add("payments", "Payments to make", bills.map(bill => ({ id: `bill:${bill.id}`, title: `${bill.typeLabel} · ${bill.period}`, detail: new Intl.NumberFormat("en-KE", { style: "currency", currency: organization?.currencyCode ?? "KES" }).format(bill.balance), action: "Review bill", href: "/dashboard/tenant/invoice", dueAt: bill.dueDate.toISOString(), urgency: billUrgency(bill.dueDate, now), native: { screen: "bills" } })));
    }
  }
  if (orgId && ["TENANT", "CARETAKER"].includes(role ?? "")) {
    const path = role === "TENANT" ? "/dashboard/tenant/issues" : "/dashboard/caretaker/issues";
    if ((role !== "TENANT" || await nativeTenantSection(session, path)) && canAccessWorkspacePath(session, path) && !rolePolicyBlocksPath(session.orgRolePolicy, role === "TENANT" ? "/api/mobile/tenant/issues" : "/api/mobile/caretaker/issues")) {
      const rows = await prisma.issueTicket.findMany({ where: { orgId, status: { in: ["OPEN", "IN_PROGRESS"] }, ...(role === "TENANT" ? { reportedByUserId: session.userId } : { assignedToUserId: session.userId, unit: nativeUnitScope(orgId, session.membershipScope) }) }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: LIMIT + 1, select: { id: true, title: true, status: true, priority: true } });
      add("work", role === "TENANT" ? "Your open maintenance requests" : "Your assigned maintenance", rows.map(row => ({ id: `issue:${row.id}`, title: row.title, detail: `${row.status.replaceAll("_", " ")} · ${row.priority.toLowerCase()} priority`, action: "Review maintenance", href: path, urgency: "normal", dueAt: null, native: { screen: role === "TENANT" ? "issues" : "work-orders" } })));
    }
  }
  if (orgId && session.membershipScope?.scopeType === "ORG" && canAccessWorkspacePath(session, "/dashboard/org/operating-queue")) {
    const groups = await getOperatingQueue(orgId, organization?.currencyCode ?? "KES");
    for (const group of groups) {
      if (!canAccessWorkspacePath(session, group.href)) continue;
      const items = group.items.filter(item => canAccessWorkspacePath(session, item.href));
      add(`operations:${group.id}`, `Team · ${group.title}`, items.map(item => ({ id: `${group.id}:${item.id}`, title: item.who, detail: `${item.where}${item.amount ? ` · ${item.amount}` : ""} · ${item.status}`, href: item.href, action: item.action, urgency: "normal", dueAt: null, native: destination(group.href) })), group.total > items.length);
    }
  }
  if (platform && !orgId || orgId && session.membershipScope?.scopeType === "ORG") {
    const groups = await getReviewQueue(session, orgId ? "organization" : "platform");
    for (const group of groups) if (canAccessWorkspacePath(session, group.href)) add(`review:${group.id}`, `Team · ${group.title}`, group.items.map(item => ({ id: `${group.id}:${item.id}`, title: item.title, detail: item.detail, href: item.href, action: group.nextAction, urgency: "normal", dueAt: null, native: destination(group.nativePath) })), group.total > group.items.length);
  }
  if (!orgId && !platform) {
    const provider = await prisma.serviceProvider.findFirst({ where: { userId: session.userId, status: "ACTIVE" }, select: { id: true } });
    if (provider) {
      const jobs = await prisma.serviceJob.findMany({ where: { providerId: provider.id, status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"] } }, orderBy: [{ updatedAt: "asc" }, { id: "asc" }], take: LIMIT + 1, select: { id: true, title: true, status: true, location: true, description: true } });
      add("work", "Your service jobs", jobs.map(job => ({ id: `job:${job.id}`, title: job.title, detail: `${job.status.replaceAll("_", " ")} · ${job.location}\n${job.description}`, href: "/provider#jobs", action: "Review job", dueAt: null, urgency: "normal", native: null })));
    }
  }
  // Include only destinations that the same workspace guard authorizes.
  const shortcuts: Array<[string, string, string, TodayItem["native"]]> = role === "LANDLORD" ? [["Your properties", "Review your assigned property portfolio and decisions.", "/dashboard/landlord", { screen: "workspace", kind: "landlord", path: "/dashboard/landlord" }]] : role === "SECURITY" ? [["Gate activity", "Review arrivals and visitor passes for your assigned gate.", "/dashboard/gate", { screen: "gate" }]] : !orgId && !platform ? [["Your provider workspace", "Review your jobs, applications and customer conversations.", "/provider", null]] : [];
  add("workspace", "Your workspace", shortcuts.filter(([, , href]) => canAccessWorkspacePath(session, href)).map(([title, detail, href, native]) => ({ id: href, title, detail, href, native, action: "Open workspace", urgency: "normal", dueAt: null })));
  return summary;
}
