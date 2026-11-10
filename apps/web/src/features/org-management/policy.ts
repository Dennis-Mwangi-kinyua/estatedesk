import { z } from "zod";
import type { AppSession } from "@/lib/auth/session";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";

export const sections = ["approvals", "collections", "renewals", "activity", "handovers", "performance"] as const;
export type ManagementSection = typeof sections[number];
export class ManagementError extends Error {}
export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ManagementError(message);
}
export function assertManagementSession(session: AppSession, section: ManagementSection) {
  ensure(session.activeOrgId && session.membershipScope?.scopeType === "ORG" && !session.mustChangePassword && !session.requiresTermsAcceptance && canAccessWorkspacePath(session, `/dashboard/org/${section}`), "Organization-wide access to this workspace is required.");
  const required = { approvals: "finance.requests.review", collections: "payments.record", renewals: "leases.manage", activity: "org.users.manage", handovers: "org.users.manage", performance: "reports.view" } as const;
  ensure(session.orgRolePolicy?.permissions[required[section]] !== "deny", "Your organization has restricted this management operation.");
  return session.activeOrgId;
}
export function canReview(session: AppSession, kind: string, amount: number, limit: number) {
  if (!canAccessApprovalKind(session, kind)) return false;
  const permission = kind === "RENT_CHANGE" ? "leases.manage" : kind === "STAFF_ACCESS" ? "org.users.manage" : "finance.requests.review";
  if (!memberHasOrgPermission(session, permission)) return false;
  if (session.activeOrgRole === "ADMIN") return true;
  return kind !== "STAFF_ACCESS" && kind !== "RENT_CHANGE" && ["MANAGER", "ACCOUNTANT"].includes(session.activeOrgRole ?? "") && amount <= limit;
}
export const approvalPaths: Record<string, string> = { EXPENSE: "/dashboard/org/expenditures", REFUND: "/dashboard/org/move-outs", WRITE_OFF: "/dashboard/org/charges", RENT_CHANGE: "/dashboard/org/leases", STAFF_ACCESS: "/dashboard/org/staff" };
export function canAccessApprovalKind(session: AppSession, kind: string) {
  return !!approvalPaths[kind] && canAccessWorkspacePath(session, approvalPaths[kind]);
}
export const moneyInput = z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/, "Use an amount with at most two decimal places.").refine(v => Number(v) > 0, "Enter an amount greater than zero.");
export const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(`${v}T00:00:00Z`); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, "Choose a valid calendar date.");
export const endOfDay = (v: string) => new Date(`${dateInput.parse(v)}T23:59:59.999+03:00`);
export const startOfDay = (v: string) => new Date(`${dateInput.parse(v)}T00:00:00+03:00`);
export const approvalSchema = z.object({ kind: z.enum(["EXPENSE", "REFUND", "RENT_CHANGE", "WRITE_OFF", "STAFF_ACCESS"]), targetId: z.string().min(1).max(100), amount: z.union([moneyInput, z.literal("")]), reason: z.string().trim().min(5).max(2000) });
export const promiseSchema = z.object({ leaseId: z.string().min(1).max(100), assigneeId: z.string().min(1).max(100), amount: moneyInput, dueDate: dateInput, followUpDate: dateInput, notes: z.string().trim().min(5).max(2000) });
export const renewalSchema = z.object({ leaseId: z.string().min(1).max(100), proposedRent: moneyInput, proposedEndDate: dateInput, notice: z.string().trim().min(10).max(4000) });
export const handoverSchema = z.object({ fromUserId: z.string().min(1).max(100), toUserId: z.string().min(1).max(100), endDate: z.union([dateInput, z.literal("")]), notes: z.string().trim().min(5).max(2000) });
export function promiseProgress(amount: number, baseline: number, paid: number, dueAt: Date, now = new Date()) {
  const received = Math.max(0, Math.round((paid - baseline) * 100) / 100);
  return { received, status: received >= amount ? "FULFILLED" : dueAt < now ? "BROKEN" : "OPEN" };
}
export function performanceMetrics(charged: number, collected: number, costs: number, arrears: number, units: number, vacant: number, occupied = units - vacant) {
  return { charged, collected, costs, arrears, netIncome: collected - costs, collectionRate: charged > 0 ? collected / charged * 100 : null, occupancyRate: units > 0 ? occupied / units * 100 : null };
}
