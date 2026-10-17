import { z } from "zod";
import { ORG_PERMISSIONS } from "./role-matrix";

export const ORGANIZATION_ROLES = ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "SECURITY", "TENANT", "LANDLORD"] as const;
export const ORG_VIEW_LABELS = {
  properties: "Properties, buildings and units", tenants: "Tenants", leases: "Leases",
  payments: "Payments", bills: "Tenant bills and invoices", "water-bills": "Water bills",
  accounting: "Accounting", charges: "Charges", reports: "Reports", issues: "Maintenance requests",
  inspections: "Inspections", staff: "Staff", agreements: "Service agreements and DPA",
  settings: "Organization settings", notifications: "Notifications", documents: "Documents",
  meters: "Meter readings", units: "Assigned units", visitors: "Visitors and gate records",
  taxes: "Taxes", airbnb: "Short stays", community: "Community", insights: "Insights",
  "move-outs": "Move-outs", "finance-requests": "Finance requests", imports: "Imports",
  "vacancy-inquiries": "Vacancy inquiries", "identity-verification": "Identity verification",
  "service-providers": "Service providers", security: "Security", support: "Support", help: "Help",
} as const;
export type OrgView = keyof typeof ORG_VIEW_LABELS;
const views = Object.keys(ORG_VIEW_LABELS) as [OrgView, ...OrgView[]];
export const orgRolePolicySchema = z.object({
  permissions: z.partialRecord(z.enum(ORG_PERMISSIONS), z.enum(["allow", "deny"])).default({}),
  blockedViews: z.array(z.enum(views)).max(views.length).default([]),
});
export type OrgRolePolicy = z.infer<typeof orgRolePolicySchema>;
export const orgRolePoliciesSchema = z.partialRecord(z.enum(ORGANIZATION_ROLES), orgRolePolicySchema);
export type OrgRolePolicies = z.infer<typeof orgRolePoliciesSchema>;

export function readOrgRolePolicies(value: unknown): OrgRolePolicies {
  const parsed = orgRolePoliciesSchema.safeParse(value ?? {});
  // Invalid persisted policy must never silently fall back to broader access.
  if (!parsed.success) throw new Error("Organization role access configuration is invalid.");
  return parsed.data;
}

/** The same section keys cover navigation, legacy links, and scoped APIs. */
export function orgViewForPath(pathname: string): OrgView | null {
  let path: string;
  try { path = new URL(pathname, "https://estatedesk.invalid").pathname; } catch { return null; }
  const segments = path.split("/").filter(Boolean);
  let section = segments[0];
  if (section === "dashboard") {
    if (["gate", "security"].includes(segments[1])) return "visitors";
    section = segments[2];
    if (segments[1] === "org" && section === "units") return "properties";
    if (["org", "tenant", "caretaker", "landlord"].includes(segments[1]) && !section) return null;
  } else if (section === "api") {
    if (segments[1] === "mobile") section = segments[2] === "org" && segments[3] === "units" ? "properties" : segments[3] ?? segments[2];
    else if (["org", "tenant", "caretaker", "landlord"].includes(segments[1])) section = segments[2];
    else section = segments[1];
  } else if (["tenants", "buildings"].includes(section) && segments[1]) {
    if (["bills", "payments", "documents", "leases", "notifications"].includes(segments[1])) section = segments[1];
  }
  const aliases: Record<string, OrgView> = {
    buildings: "properties", invoice: "bills", invoices: "bills", receipts: "payments",
    "service-agreements": "agreements", "meter-readings": "meters", readings: "meters",
    "water-readings": "meters", "water-meters": "meters", "visitor-passes": "visitors",
    "lease-agreements": "leases", expenditures: "accounting", "verify-tenant": "identity-verification",
  };
  return aliases[section] ?? (section in ORG_VIEW_LABELS ? section as OrgView : null);
}

export function rolePolicyBlocksPath(policy: OrgRolePolicy | undefined, pathname: string) {
  const view = orgViewForPath(pathname);
  return !!view && !!policy?.blockedViews.includes(view);
}
