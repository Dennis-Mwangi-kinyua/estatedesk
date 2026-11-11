export type NavigationItem = { href: string };
export type NavigationSection = { label: string; hrefs: readonly string[] };
export type NavigationWorkspace = "org" | "tenant" | "caretaker" | "landlord" | "platform-admin" | "platform-developer";

const org = (paths: string[]) => paths.map(path => `/dashboard/org${path ? `/${path}` : ""}`);
const tenant = (paths: string[]) => paths.map(path => `/dashboard/tenant${path ? `/${path}` : ""}`);
const caretaker = (paths: string[]) => paths.map(path => `/dashboard/caretaker${path ? `/${path}` : ""}`);
const platform = (paths: string[]) => paths.map(path => `/platform${path ? `/${path}` : ""}`);

/** Shared by the web drawer, desktop sidebar and native platform menu. */
export const PLATFORM_NAVIGATION: readonly NavigationSection[] = [
  { label: "Overview", hrefs: platform(["", "search", "review-queue"]) },
  { label: "Customers & growth", hrefs: platform(["demos", "crm", "onboarding", "organizations", "agreements", "marketing"]) },
  { label: "Revenue & finance", hrefs: platform(["payments", "payment-ops", "expenditures", "billing", "subscriptions", "reports"]) },
  { label: "People & communication", hrefs: platform(["users", "landlords", "service-providers", "recruitment", "messages", "broadcasts"]) },
  { label: "Reliability & integrations", hrefs: platform(["system-health", "jobs", "api-explorer", "api-keys", "rate-limits", "feature-flags", "data-management", "backups"]) },
  { label: "Security & governance", hrefs: platform(["admins", "permissions", "identity-verification", "privacy-requests", "security", "audit-logs", "support-access", "control"]) },
  { label: "Settings & guidance", hrefs: platform(["settings", "developer/docs", "help"]) },
];

export const WORKSPACE_NAVIGATION: Record<NavigationWorkspace, readonly NavigationSection[]> = {
  org: [
    { label: "Management", hrefs: org(["approvals", "collections", "renewals", "activity", "handovers", "performance"]) },
    { label: "Workspace", hrefs: org(["", "setup", "insights", "operating-queue"]) },
    { label: "Portfolio & occupancy", hrefs: org(["properties", "landlords", "buildings", "units", "airbnb", "tenants", "leases", "vacancy-inquiries", "verify-tenant", "identity-verification"]) },
    { label: "Finance", hrefs: org(["payments", "charges", "charges/bills", "water-bills", "accounting", "accounting/requests", "finance-requests", "expenditures", "taxes", "reports"]) },
    { label: "Operations", hrefs: [...org(["issues", "issues/resolution-reports", "inspections", "move-outs", "service-providers"]), "/dashboard/gate"] },
    { label: "Communication", hrefs: org(["crm", "notifications", "community"]) },
    { label: "Administration", hrefs: org(["staff", "recruitment", "imports", "agreements", "settings"]) },
    { label: "Account & help", hrefs: [...org(["profile", "security", "support"]), "/dashboard/security"] },
  ],
  tenant: [
    { label: "My home", hrefs: tenant(["", "lease", "renewals", "documents", "history"]) },
    { label: "Payments & bills", hrefs: tenant(["payments", "invoice", "water-bills", "expenditures", "rewards"]) },
    { label: "Living & support", hrefs: tenant(["issues", "inspections", "notices", "visitors", "community", "notifications"]) },
    { label: "My account", hrefs: [...tenant(["profile"]), "/dashboard/security"] },
  ],
  caretaker: [
    { label: "Daily work", hrefs: caretaker(["today", "calendar", "", "search"]) },
    { label: "Field operations", hrefs: [...caretaker(["issues", "inspections", "water-bills", "move-outs", "handover", "vendors"]), "/dashboard/gate"] },
    { label: "Assigned portfolio", hrefs: caretaker(["units", "tenants", "leases", "documents"]) },
    { label: "Communication & requests", hrefs: caretaker(["notifications", "broadcasts", "finance-requests"]) },
    { label: "My account", hrefs: caretaker(["profile", "security"]) },
  ],
  landlord: [
    { label: "Portfolio", hrefs: ["/dashboard/landlord", "/dashboard/landlord#properties", "/dashboard/landlord#tenants"] },
    { label: "Finance", hrefs: ["/dashboard/landlord/statements", "/dashboard/landlord/payouts"] },
    { label: "My account", hrefs: ["/dashboard/security"] },
  ],
  "platform-admin": PLATFORM_NAVIGATION,
  "platform-developer": PLATFORM_NAVIGATION,
};

/** Group the already-authorized links once; retain new routes in a fallback group. */
export function groupNavigation<T extends NavigationItem>(items: readonly T[], sections: readonly NavigationSection[]) {
  const byHref = new Map(items.map(item => [item.href, item]));
  const groups: { label: string; items: T[] }[] = [];
  for (const section of sections) {
    const matches: T[] = [];
    for (const href of section.hrefs) {
      const item = byHref.get(href);
      if (item) { matches.push(item); byHref.delete(href); }
    }
    if (matches.length) groups.push({ label: section.label, items: matches });
  }
  if (byHref.size) groups.push({ label: "More tools", items: [...byHref.values()] });
  return groups;
}

/** Only the most specific matching destination is current. Hash links are exact. */
export function activeNavigationHref(pathname: string, items: readonly NavigationItem[], hash = ""): string | null {
  let active: string | null = null;
  for (const { href } of items) {
    const [path, itemHash] = href.split("#");
    const home = ["/dashboard/org", "/dashboard/tenant", "/dashboard/caretaker", "/dashboard/landlord", "/platform", "/platform/developer"].includes(path);
    const matches = itemHash
      ? pathname === path && hash === `#${itemHash}`
      : pathname === path || (!home && pathname.startsWith(`${path}/`));
    if (matches && (!active || href.length > active.length)) active = href;
  }
  return active;
}
