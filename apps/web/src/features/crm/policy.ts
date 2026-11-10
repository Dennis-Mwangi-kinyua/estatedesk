import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { scopedUnitWhere, type RecordScope } from "@/lib/permissions/record-scope";

export const stages = ["NEW", "QUALIFIED", "DEMO_SCHEDULED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
export const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
export const leadSchema = z.object({
  fullName: z.string().trim().min(2).max(120), companyName: z.string().trim().min(2).max(160),
  workEmail: z.string().trim().email().max(160), phone: z.string().trim().max(40),
  managedPropertyType: z.string().trim().min(1).max(100), message: z.string().trim().max(4000),
});
export const dealSchema = z.object({
  salesStage: z.enum(stages), salesOwnerId: z.string().max(100), customerOrgId: z.string().max(100),
  expectedMonthlyValue: z.union([z.literal(""), z.coerce.number().min(0).max(9999999999.99)]),
  currencyCode: z.string().regex(/^[A-Z]{3}$/), targetPlan: z.string().trim().max(80),
  demoAt: z.union([z.literal(""), z.string().datetime({ offset: true })]),
  lostReason: z.string().trim().max(1000), updatedAt: z.string().datetime(),
}).superRefine((v, ctx) => {
  if (v.salesStage === "LOST" && !v.lostReason) ctx.addIssue({ code: "custom", message: "Give a reason for the lost deal", path: ["lostReason"] });
  if (v.salesStage === "WON" && !v.customerOrgId) ctx.addIssue({ code: "custom", message: "Link the customer organization before marking won", path: ["customerOrgId"] });
  if (v.salesStage === "DEMO_SCHEDULED" && !v.demoAt) ctx.addIssue({ code: "custom", message: "Choose a demo date", path: ["demoAt"] });
});
export const activitySchema = z.object({
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  kind: z.enum(["NOTE", "CALL", "EMAIL", "DEMO", "TASK"]), body: z.string().trim().min(1).max(4000),
  assigneeId: z.string().max(100), dueAt: z.union([z.literal(""), z.string().datetime({ offset: true })]),
}).superRefine((v, ctx) => {
  if ((v.kind === "TASK" || v.kind === "DEMO") && !v.dueAt) ctx.addIssue({ code: "custom", message: "Tasks and demos need a due date", path: ["dueAt"] });
});
export function tenantCrmWhere(orgId: string, scope: RecordScope): Prisma.TenantWhereInput {
  return { orgId, deletedAt: null, ...(scope?.scopeType === "ORG" ? {} : { leases: { some: { deletedAt: null, unit: scopedUnitWhere(orgId, scope) } } }) };
}
