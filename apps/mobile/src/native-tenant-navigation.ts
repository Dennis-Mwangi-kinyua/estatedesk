import type { MobileSession } from "@estatedesk/contracts/mobile";

export const nativeTenantRoutes = {
  "/dashboard/tenant/community": "community",
  "/dashboard/tenant/expenditures": "expenditures",
  "/dashboard/tenant/payments": "bills",
  "/dashboard/tenant/water-bills": "water-bills",
  "/dashboard/tenant/invoice": "invoices",
  "/dashboard/tenant/lease": "leases",
  "/dashboard/tenant/history": "history",
  "/dashboard/tenant/notices": "move-outs",
  "/dashboard/tenant/issues": "issues",
  "/dashboard/tenant/notifications": "notifications",
  "/dashboard/tenant/documents": "documents",
  "/dashboard/tenant/visitors": "visitors",
  "/dashboard/tenant/profile": "profile",
  "/dashboard/tenant/help": "help",
} as const;
export type NativeTenantScreen = typeof nativeTenantRoutes[keyof typeof nativeTenantRoutes];

/** Display routing only. The native API still authorizes each request. */
export function nativeTenantDestination(path: string, session: MobileSession): NativeTenantScreen | null {
  const target = nativeTenantRoutes[path as keyof typeof nativeTenantRoutes];
  if (!target) return null;
  if (["bills", "water-bills", "invoices"].includes(target) && !session.canViewBills) return null;
  const feature = { leases: "leases", "move-outs": "move-outs", documents: "documents", visitors: "visitors" } as const;
  const required = feature[target as keyof typeof feature];
  return required && !session.features.includes(required) ? null : target;
}
