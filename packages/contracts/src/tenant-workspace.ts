/** Entry points for the full tenant workspace hosted inside the native apps. */
export const tenantWorkspaceLinks = [
  ["Overview", "/dashboard/tenant"],
  ["My history", "/dashboard/tenant/history"],
  ["Community board", "/dashboard/tenant/community"],
  ["Visitors", "/dashboard/tenant/visitors"],
  ["Profile", "/dashboard/tenant/profile"],
  ["Security", "/dashboard/security"],
  ["Lease and signing", "/dashboard/tenant/lease"],
  ["Payments and statements", "/dashboard/tenant/payments"],
  ["RentRewards", "/dashboard/tenant/rewards"],
  ["Invoices", "/dashboard/tenant/invoice"],
  ["Expenditures", "/dashboard/tenant/expenditures"],
  ["Water bills", "/dashboard/tenant/water-bills"],
  ["Maintenance and repairs", "/dashboard/tenant/issues"],
  ["Inspections", "/dashboard/tenant/inspections"],
  ["Notices and move-out", "/dashboard/tenant/notices"],
  ["Notifications", "/dashboard/tenant/notifications"],
  ["Documents", "/dashboard/tenant/documents"],
  ["Help", "/dashboard/tenant/help"],
] as const;

export function tenantWorkspaceEntry(value: string | null): string {
  return tenantWorkspaceLinks.find(([, path]) => path === value)?.[1] ?? "/dashboard/tenant";
}

export function tenantDocumentPath(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || url.username || url.password) return null;
    const path = url.pathname;
    if (/^\/dashboard\/tenant\/(?:lease|inspections|invoice)\/[^/]+\/download$/.test(path) ||
        /^\/dashboard\/tenant\/receipts\/[^/]+$/.test(path) ||
        /^\/api\/receipts\/[^/]+$/.test(path) ||
        /^\/api\/move-outs\/[^/]+\/report$/.test(path) ||
        path === "/dashboard/tenant/payments/statement") return path + url.search;
  } catch { /* Untrusted navigation URL. */ }
  return null;
}

export function tenantNavigation(value: string, origin: string): "internal" | "external" | "exit" | "blocked" {
  try {
    const url = new URL(value);
    if (url.username || url.password) return "blocked";
    if (url.origin === origin && ["https:", "http:"].includes(url.protocol)) {
      if (url.pathname === "/login" || url.pathname.startsWith("/login/")) return "exit";
      return "internal";
    }
    if (["https:", "mailto:", "tel:"].includes(url.protocol)) return "external";
  } catch { /* Untrusted navigation URL. */ }
  return "blocked";
}
