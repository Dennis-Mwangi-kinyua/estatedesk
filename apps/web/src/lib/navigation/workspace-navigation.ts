export type NavigationItem = { href: string };
export type NavigationSection = { label: string; hrefs: readonly string[] };
export type NavigationWorkspace = "org" | "tenant" | "caretaker" | "landlord" | "platform-admin" | "platform-developer";

const org = (paths: string[]) => paths.map(path => `/dashboard/org${path ? `/${path}` : ""}`);
const tenant = (paths: string[]) => paths.map(path => `/dashboard/tenant${path ? `/${path}` : ""}`);
const caretaker = (paths: string[]) => paths.map(path => `/dashboard/caretaker${path ? `/${path}` : ""}`);
const platform = (paths: string[]) => paths.map(path => `/platform${path ? `/${path}` : ""}`);

const platformAccount: NavigationSection[] = [
  { label: "Access & security", hrefs: platform(["users", "admins", "permissions", "identity-verification", "security", "audit-logs", "support-access"]) },
  { label: "Settings & help", hrefs: platform(["settings", "help"]) },
];

export const WORKSPACE_NAVIGATION: Record<NavigationWorkspace, readonly NavigationSection[]> = {
  org: [
    { label: "Workspace", hrefs: org(["", "insights"]) },
    { label: "Portfolio & occupancy", hrefs: org(["properties", "buildings", "units", "airbnb", "tenants", "leases", "vacancy-inquiries", "verify-tenant", "identity-verification"]) },
    { label: "Finance", hrefs: org(["payments", "charges", "water-bills", "accounting", "accounting/requests", "finance-requests", "expenditures", "taxes", "reports"]) },
    { label: "Operations", hrefs: [...org(["issues", "issues/resolution-reports", "inspections", "move-outs", "service-providers"]), "/dashboard/gate"] },
    { label: "Communication", hrefs: org(["notifications", "community"]) },
    { label: "Administration", hrefs: org(["staff", "imports", "settings"]) },
    { label: "Account & help", hrefs: [...org(["profile", "security", "support"]), "/dashboard/security"] },
  ],
  tenant: [
    { label: "My home", hrefs: tenant(["", "lease", "documents", "history"]) },
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
  "platform-admin": [
    { label: "Workspace", hrefs: platform(["", "search"]) },
    { label: "Customers & onboarding", hrefs: platform(["organizations", "onboarding", "service-providers"]) },
    { label: "Finance", hrefs: platform(["payments", "payment-ops", "expenditures", "billing", "subscriptions", "reports"]) },
    { label: "Communication", hrefs: platform(["messages", "broadcasts", "marketing"]) },
    ...platformAccount,
  ],
  "platform-developer": [
    { label: "Engineering", hrefs: platform(["developer", "system-health", "jobs", "developer/docs"]) },
    { label: "Integrations & data", hrefs: platform(["api-explorer", "api-keys", "rate-limits", "feature-flags", "data-management", "backups"]) },
    { label: "Site administration", hrefs: platform(["control", "organizations", "service-providers", "billing", "subscriptions", "broadcasts"]) },
    ...platformAccount,
  ],
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
