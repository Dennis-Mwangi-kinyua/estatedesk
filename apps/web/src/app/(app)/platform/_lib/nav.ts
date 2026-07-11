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

/**
 * Site-admin capabilities available from both Administration and Developer.
 * Keeps developer operators able to run the business plane without mode-switching.
 */
export const siteOpsNavItems: readonly PlatformNavItem[] = [
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

/**
 * Paths that still require SUPER_ADMIN (nuclear site control only).
 * API keys, jobs, data, and backups are available to all platform operators.
 */
export const superAdminOnlyPaths = ["/platform/control"] as const;

/** Roles allowed for ordinary platform operator tooling. */
export const PLATFORM_OPERATOR_ROLES = ["SUPER_ADMIN", "PLATFORM_ADMIN"] as const;

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
      "System health, APIs, jobs, site ops, feature flags, and control-plane tooling",
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
