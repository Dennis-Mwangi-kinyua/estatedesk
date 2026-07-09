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
  href: string;
  label: string;
  icon: PlatformNavIconName;
  description?: string;
  /** Only SUPER_ADMIN can open this item. */
  superAdminOnly?: boolean;
  /** Shown in both Administration and Developer navs. */
  dualMode?: boolean;
};

/** Routes that stay sticky with the user's preferred mode (not forced by path). */
export const dualModeNavItems: readonly PlatformNavItem[] = [
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
  { href: "/platform/organizations", label: "Organizations", icon: "Building2" },
  { href: "/platform/users", label: "Platform Users", icon: "Users" },
  { href: "/platform/admins", label: "Platform Admins", icon: "ShieldCheck" },
  { href: "/platform/permissions", label: "Permissions", icon: "LockKeyhole" },
  { href: "/platform/support-access", label: "Support Access", icon: "LifeBuoy" },
  { href: "/platform/billing", label: "Billing", icon: "CreditCard" },
  { href: "/platform/subscriptions", label: "Subscriptions", icon: "BriefcaseBusiness" },
  { href: "/platform/payments", label: "Payments", icon: "ReceiptText" },
  { href: "/platform/expenditures", label: "Expenditures", icon: "ReceiptText" },
  { href: "/platform/payment-ops", label: "Payment Ops", icon: "RefreshCcw" },
  { href: "/platform/onboarding", label: "Onboarding", icon: "SlidersHorizontal" },
  { href: "/platform/marketing", label: "Marketing", icon: "BriefcaseBusiness" },
  { href: "/platform/broadcasts", label: "Broadcasts", icon: "Bell" },
  { href: "/platform/messages", label: "Messages", icon: "Mail" },
  { href: "/platform/reports", label: "Reports", icon: "BarChart3" },
  { href: "/platform/settings", label: "Settings", icon: "UserCog" },
  ...dualModeNavItems,
] as const;

/** Engineering, ops, and integration tools for the developer portal. */
export const developerNavItems: readonly PlatformNavItem[] = [
  {
    href: "/platform/developer",
    label: "Developer Home",
    icon: "Code2",
    description: "Ops hub, integrations, and tooling overview",
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
    superAdminOnly: true,
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
    superAdminOnly: true,
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
    superAdminOnly: true,
  },
  {
    href: "/platform/backups",
    label: "Backups",
    icon: "HardDrive",
    description: "Backup checkpoints and restore readiness",
    superAdminOnly: true,
  },
  ...dualModeNavItems,
] as const;

/** Paths that require SUPER_ADMIN (mutations and page access). */
export const superAdminOnlyPaths = [
  "/platform/control",
  "/platform/api-keys",
  "/platform/jobs",
  "/platform/data-management",
  "/platform/backups",
] as const;

const DEVELOPER_EXCLUSIVE_HREFS = new Set(
  developerNavItems.filter((item) => !item.dualMode).map((item) => item.href),
);

const DUAL_MODE_HREFS = new Set(dualModeNavItems.map((item) => item.href));

export const PLATFORM_MODE_STORAGE_KEY = "estatedesk.platform.mode";
export const PLATFORM_MODE_COOKIE_NAME = "estatedesk_platform_mode";
export const PLATFORM_LAST_PATH_ADMIN_KEY = "estatedesk.platform.lastPath.admin";
export const PLATFORM_LAST_PATH_DEVELOPER_KEY =
  "estatedesk.platform.lastPath.developer";

export function isPlatformMode(value: unknown): value is PlatformMode {
  return value === "admin" || value === "developer";
}

export function isDualModePath(pathname: string): boolean {
  for (const href of DUAL_MODE_HREFS) {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return true;
    }
  }
  return false;
}

export function isDeveloperExclusivePath(pathname: string): boolean {
  if (pathname === "/platform/developer" || pathname.startsWith("/platform/developer/")) {
    return true;
  }

  for (const href of DEVELOPER_EXCLUSIVE_HREFS) {
    if (href === "/platform/developer") continue;
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return true;
    }
  }

  return false;
}

export function isDeveloperPath(pathname: string): boolean {
  return isDeveloperExclusivePath(pathname) || isDualModePath(pathname);
}

export function isSuperAdminOnlyPath(pathname: string): boolean {
  for (const href of superAdminOnlyPaths) {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return true;
    }
  }
  return false;
}

/**
 * Path-forced mode when the route belongs exclusively to one portal.
 * Dual-mode routes return null so the caller's preferred mode sticks.
 */
export function forcedModeForPath(pathname: string): PlatformMode | null {
  if (isDeveloperExclusivePath(pathname)) return "developer";
  if (isDualModePath(pathname)) return null;
  if (pathname === "/platform" || pathname.startsWith("/platform/")) return "admin";
  return null;
}

export function resolvePlatformMode(
  pathname: string,
  preferredMode: PlatformMode = "admin",
): PlatformMode {
  return forcedModeForPath(pathname) ?? preferredMode;
}

export function getNavItemsForMode(
  mode: PlatformMode,
  options?: { isSuperAdmin?: boolean },
): readonly PlatformNavItem[] {
  const items = mode === "developer" ? developerNavItems : adminNavItems;
  if (options?.isSuperAdmin !== false && options?.isSuperAdmin !== true) {
    return items;
  }
  if (options.isSuperAdmin) return items;
  return items.filter((item) => !item.superAdminOnly);
}

export function getModeHome(mode: PlatformMode): string {
  return mode === "developer" ? "/platform/developer" : "/platform";
}

export function lastPathStorageKey(mode: PlatformMode): string {
  return mode === "developer"
    ? PLATFORM_LAST_PATH_DEVELOPER_KEY
    : PLATFORM_LAST_PATH_ADMIN_KEY;
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

export function parsePlatformModeCookie(value: string | undefined | null): PlatformMode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isPlatformMode(normalized) ? normalized : null;
}

export const modeMeta: Record<
  PlatformMode,
  {
    label: string;
    shortLabel: string;
    brandSubtitle: string;
    headerTitle: string;
    headerDescription: string;
  }
> = {
  admin: {
    label: "Administration",
    shortLabel: "Admin",
    brandSubtitle: "Platform administration",
    headerTitle: "Platform Admin",
    headerDescription:
      "Manage organizations, platform users, billing, messages, and reports",
  },
  developer: {
    label: "Developer",
    shortLabel: "Developer",
    brandSubtitle: "Developer portal",
    headerTitle: "Developer Portal",
    headerDescription:
      "System health, APIs, jobs, feature flags, rate limits, and data tooling",
  },
};

/** Feature flag keys managed from the developer portal. */
export const PLATFORM_FEATURE_FLAG_KEYS = [
  "taxes",
  "waterBilling",
  "inspections",
  "tenantPortal",
  "whatsappNotifications",
  "kraIntegration",
  "mpesaPayments",
] as const;

export type PlatformFeatureFlagKey = (typeof PLATFORM_FEATURE_FLAG_KEYS)[number];
