export const platformNavIconNames = [
  "Gauge",
  "Activity",
  "Search",
  "Building2",
  "Users",
  "ShieldCheck",
  "LockKeyhole",
  "ShieldAlert",
  "LifeBuoy",
  "CreditCard",
  "BriefcaseBusiness",
  "KeyRound",
  "ReceiptText",
  "RefreshCcw",
  "Flag",
  "SlidersHorizontal",
  "Bell",
  "Settings",
  "Database",
  "FileChartColumn",
  "Mail",
  "BarChart3",
  "UserCog",
  "Code2",
  "Terminal",
  "HardDrive",
  "Timer",
  "Webhook",
  "BookOpen",
  "Zap",
] as const;

export type PlatformNavIconName = (typeof platformNavIconNames)[number];

export type PlatformMode = "admin" | "developer";

export type PlatformNavItem = {
  native?: boolean;
  href: string;
  label: string;
  icon: PlatformNavIconName;
  description?: string;
  /** Only SUPER_ADMIN can open this item. */
  superAdminOnly?: boolean;
  /** Shown in both Administration and Developer navs. */
  dualMode?: boolean;
  /** Optional pending-work count rendered as a red navigation badge. */
  badgeCount?: number;
};

/**
 * Site-admin capabilities available from both Administration and Developer.
 * Keeps developer operators able to run the business plane without mode-switching.
 */
export const siteOpsNavItems: readonly PlatformNavItem[] = [
  { href: "/platform/demos", label: "Demo requests", icon: "Timer", description: "Demo enquiries, appointments and trial follow-up", dualMode: true },
  { href: "/platform/recruitment", label: "Recruitment", icon: "BriefcaseBusiness", description: "Publish EstateDesk jobs and review applications", dualMode: true, native: false },
  {href:"/platform/privacy-requests",label:"Privacy requests",icon:"ShieldCheck",description:"Account deletion, identity and retention reviews",dualMode:true},
  { href: "/platform/crm", label: "Sales & Customer CRM", icon: "BriefcaseBusiness", description: "Prospects, customers, communication, tasks and reports", dualMode: true },
  { href: "/platform/review-queue", label: "Review queue", icon: "ShieldCheck", description: "Pending reviews, responsible teams and next actions", dualMode: true },
  { href: "/platform/landlords", label: "Landlords", icon: "Users", description: "Landlord accounts and property assignments by organization", dualMode: true },
  { href: "/platform/agreements", label: "Service agreements", icon: "BookOpen", description: "Organization service agreements, DPA signing and delivery", dualMode: true },
  { href: "/platform/identity-verification", label: "ID verification", icon: "ShieldCheck", description: "Authenticate duplicate ID registrations and approve existing-account links", dualMode: true },
  { href: "/platform/service-providers", label: "Service providers", icon: "BriefcaseBusiness", description: "Registrations, online activity and reported accounts", dualMode: true },
  {
    href: "/platform/organizations",
    label: "Organizations",
    icon: "Building2",
    description: "Portfolio companies and workspace status",
    dualMode: true,
  },
  {
    href: "/platform/users",
    label: "Platform Users",
    icon: "Users",
    description: "Accounts, roles, and access posture",
    dualMode: true,
  },
  {
    href: "/platform/admins",
    label: "Platform Admins",
    icon: "ShieldCheck",
    description: "Operator accounts and admin provisioning",
    dualMode: true,
  },
  {
    href: "/platform/permissions",
    label: "Permissions",
    icon: "LockKeyhole",
    description: "Access matrix and explicit grants",
    dualMode: true,
  },
  {
    href: "/platform/support-access",
    label: "Support Access",
    icon: "LifeBuoy",
    description: "Timed org support entry with audit trail",
    dualMode: true,
  },
  {
    href: "/platform/billing",
    label: "Billing",
    icon: "CreditCard",
    description: "Subscription plans and renewals",
    dualMode: true,
  },
  {
    href: "/platform/subscriptions",
    label: "Subscriptions",
    icon: "BriefcaseBusiness",
    description: "Plan enforcement and changes",
    dualMode: true,
  },
  {
    href: "/platform/broadcasts",
    label: "Broadcasts",
    icon: "Bell",
    description: "Platform-wide announcements",
    dualMode: true,
  },
  {
    href: "/platform/settings",
    label: "Settings",
    icon: "UserCog",
    description: "Platform configuration",
    dualMode: true,
  },
] as const;

/** Routes that stay sticky with the user's preferred mode (not forced by path). */
export const dualModeNavItems: readonly PlatformNavItem[] = [
  ...siteOpsNavItems,
  {
    href: "/platform/help",
    label: "Help",
    icon: "BookOpen",
    description: "In-app platform guides",
    dualMode: true,
  },
  {
    href: "/platform/security",
    label: "Security",
    icon: "ShieldAlert",
    description: "Security posture and controls",
    dualMode: true,
  },
  {
    href: "/platform/audit-logs",
    label: "Audit Logs",
    icon: "FileChartColumn",
    description: "Platform and security event trail",
    dualMode: true,
  },
] as const;

/** Business and governance tools for platform operators. */
export const adminNavItems: readonly PlatformNavItem[] = [
  { href: "/platform", label: "Dashboard", icon: "Gauge" },
  { href: "/platform/search", label: "Global Search", icon: "Search" },
  { href: "/platform/payments", label: "Payments", icon: "ReceiptText" },
  { href: "/platform/expenditures", label: "Expenditures", icon: "ReceiptText" },
  { href: "/platform/payment-ops", label: "Payment Ops", icon: "RefreshCcw" },
  { href: "/platform/onboarding", label: "Onboarding", icon: "SlidersHorizontal" },
  { href: "/platform/marketing", label: "Marketing", icon: "BriefcaseBusiness" },
  { href: "/platform/messages", label: "Messages", icon: "Mail" },
  { href: "/platform/reports", label: "Reports", icon: "BarChart3" },
  ...dualModeNavItems,
] as const;

/**
 * Engineering + site-ops tools for the developer portal.
 * Most tools are open to PLATFORM_ADMIN; only Website Control is SUPER_ADMIN-only.
 */
export const developerNavItems: readonly PlatformNavItem[] = [
  {
    href: "/platform/developer",
    label: "Developer Home",
    icon: "Code2",
    description: "Ops hub, integrations, and tooling overview",
  },
  {
    href: "/platform/developer/docs",
    label: "System Docs",
    icon: "BookOpen",
    description: "Private deep-dive: architecture, payments, ops",
  },
  {
    href: "/platform/control",
    label: "Website Control",
    icon: "Zap",
    description: "Kill switches, nuclear ops, org takeover",
    superAdminOnly: true,
  },
  {
    href: "/platform/system-health",
    label: "System Health",
    icon: "Activity",
    description: "Queues, payments, and integration health",
  },
  {
    href: "/platform/api-explorer",
    label: "API & Webhooks",
    icon: "Webhook",
    description: "Public APIs, webhooks, cron, and key usage",
  },
  {
    href: "/platform/api-keys",
    label: "API Keys",
    icon: "KeyRound",
    description: "Public and org-scoped API credentials",
  },
  {
    href: "/platform/feature-flags",
    label: "Feature Flags",
    icon: "Flag",
    description: "Per-organization capability configuration",
  },
  {
    href: "/platform/jobs",
    label: "Jobs & Queues",
    icon: "Settings",
    description: "Background jobs, retries, and cron runs",
  },
  {
    href: "/platform/rate-limits",
    label: "Rate Limits",
    icon: "Timer",
    description: "Abuse protection and live bucket ops",
  },
  {
    href: "/platform/data-management",
    label: "Data",
    icon: "Database",
    description: "Exports, retention, and soft-deleted records",
  },
  {
    href: "/platform/backups",
    label: "Backups",
    icon: "HardDrive",
    description: "Backup checkpoints and restore readiness",
  },
  ...dualModeNavItems,
] as const;

/** One deduplicated catalogue for the unified platform workspace. */
export const platformNavItems: readonly PlatformNavItem[] = Array.from(
  new Map([...adminNavItems, ...developerNavItems]
    .filter(item => item.href !== "/platform/developer")
    .map(item => [item.href, item])).values(),
);

export function getPlatformNavItems(options: { isSuperAdmin: boolean }): readonly PlatformNavItem[] {
  return platformNavItems.filter(item => !item.superAdminOnly || options.isSuperAdmin);
}

/**
 * Paths that still require SUPER_ADMIN (nuclear site control only).
 * API keys, jobs, data, and backups are available to all platform operators.
 */
export const superAdminOnlyPaths = ["/platform/control"] as const;

/** Roles allowed for ordinary platform operator tooling. */
export const PLATFORM_OPERATOR_ROLES = ["SUPER_ADMIN", "PLATFORM_ADMIN"] as const;

export function isSuperAdminOnlyPath(pathname: string): boolean {
  for (const href of superAdminOnlyPaths) {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return true;
    }
  }
  return false;
}

export function getNavItemsForMode(
  mode: PlatformMode,
  options?: { isSuperAdmin?: boolean },
): readonly PlatformNavItem[] {
  // Legacy callers and saved preferences receive the same unified workspace.
  void mode;
  return getPlatformNavItems({ isSuperAdmin: options?.isSuperAdmin === true });
}

export function getModeHome(mode: PlatformMode): string {
  void mode;
  return "/platform";
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/platform") {
    return pathname === "/platform";
  }

  if (href === "/platform/developer") {
    return pathname === "/platform/developer";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Feature flag keys managed from platform operations. */
export const PLATFORM_FEATURE_FLAG_KEYS = [
  "vacantHouses",
  "taxes",
  "waterBilling",
  "inspections",
  "tenantPortal",
  "whatsappNotifications",
  "kraIntegration",
  "mpesaPayments",
] as const;

export type PlatformFeatureFlagKey = (typeof PLATFORM_FEATURE_FLAG_KEYS)[number];
