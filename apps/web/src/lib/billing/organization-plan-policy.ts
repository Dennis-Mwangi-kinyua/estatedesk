import { z } from "zod";
import { APP_PLANS, type AppPlan } from "./plans";
import { ORG_VIEW_LABELS, type OrgRolePolicy, type OrgView } from "../permissions/org-role-policy";
import type { OrgPermission } from "../permissions/role-matrix";

export const PLAN_ACCESS_VIEWS = Object.keys(ORG_VIEW_LABELS) as [OrgView, ...OrgView[]];
const limit = z.number().int().min(0).max(1_000_000).nullable();
export const organizationPlanPolicySchema = z.object({
  plan: z.enum(["FREE", "PRO", "PLUS", "ENTERPRISE"]),
  propertiesLimit: limit,
  unitsLimit: limit,
  usersLimit: limit,
  allowedViews: z.array(z.enum(PLAN_ACCESS_VIEWS)).max(PLAN_ACCESS_VIEWS.length).optional(),
});
export type OrganizationPlanPolicy = z.infer<typeof organizationPlanPolicySchema>;

export function readOrganizationPlanPolicy(metadata: unknown): OrganizationPlanPolicy | null {
  const raw = metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>).organizationPlan : undefined;
  if (raw === undefined) return null;
  const parsed = organizationPlanPolicySchema.safeParse(raw);
  if (!parsed.success) throw new Error("Organization plan configuration is invalid.");
  return parsed.data;
}

export function organizationPlanLimits(plan: AppPlan, metadata: unknown) {
  const policy = readOrganizationPlanPolicy(metadata);
  if (!policy || policy.plan !== plan) return APP_PLANS[plan];
  return {
    propertiesLimit: policy.propertiesLimit ?? Number.MAX_SAFE_INTEGER,
    unitsLimit: policy.unitsLimit ?? Number.MAX_SAFE_INTEGER,
    usersLimit: policy.usersLimit ?? Number.MAX_SAFE_INTEGER,
  };
}

const permissionViews: Partial<Record<OrgPermission, OrgView>> = {
  "properties.manage": "properties", "tenants.manage": "tenants", "leases.manage": "leases",
  "payments.manage": "payments", "payments.record": "payments", "payments.verify": "payments",
  "reports.view": "reports", "reports.export": "reports", "maintenance.manage": "issues",
  "inspections.manage": "inspections", "caretaker.fieldwork": "meters",
  "move-outs.arrears.approve": "move-outs", "finance.requests.review": "finance-requests",
  "org.settings.manage": "settings", "org.users.manage": "staff", "org.users.delete": "staff",
};

/** Plan access only narrows role access; it cannot grant a role new permissions. */
export function applyOrganizationPlanAccess(policy: OrgRolePolicy | undefined, plan: string, metadata: unknown): OrgRolePolicy | undefined {
  const configured = readOrganizationPlanPolicy(metadata);
  if (plan !== "ENTERPRISE" || configured?.plan !== plan || !configured.allowedViews) return policy;
  const blockedViews = [...new Set([...(policy?.blockedViews ?? []), ...PLAN_ACCESS_VIEWS.filter(view => !configured.allowedViews!.includes(view))])];
  const permissions = { ...policy?.permissions };
  for (const [permission, view] of Object.entries(permissionViews)) {
    if (blockedViews.includes(view)) permissions[permission as OrgPermission] = "deny";
  }
  return { permissions, blockedViews };
}
