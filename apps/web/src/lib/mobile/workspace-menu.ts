import type { AppSession } from "@/lib/auth/session";
import type { MobileWorkspaceKind, MobileWorkspaceLink } from "@estatedesk/contracts/mobile";
import { SIDEBAR_LINKS } from "@/components/layout/org-sidebar-links";
import { adminNavItems, developerNavItems } from "@/app/(app)/platform/_lib/nav";
import { WORKSPACE_NAVIGATION } from "@/lib/navigation/workspace-navigation";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";

export function mobileWorkspaceAllowed(session: Pick<AppSession, "platformRole" | "activeOrgId" | "activeOrgRole">, kind: MobileWorkspaceKind) {
  return kind === "platform" ? ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole)
    : !!session.activeOrgId && ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.activeOrgRole ?? "");
}

const presentation: Record<string, [string, string]> = {
  insights: ["💡", "Review portfolio trends and insights."], profile: ["👤", "Review your profile and contact details."], airbnb: ["🛎️", "Manage short-stay accommodation."],
  "identity-verification": ["🪪", "Review identity verification requests."], "service-providers": ["🧰", "Manage service providers and registrations."],
  "finance-requests": ["💰", "Review finance requests and approvals."], "vacancy-inquiries": ["📨", "Follow up on vacancy inquiries."], "verify-tenant": ["🔎", "Review tenant verification records."],
  imports: ["📥", "Import and review workspace records."], agreements: ["🤝", "Review service agreements and signing."], gate: ["🚧", "Manage gate access and visitor passes."],
  permissions: ["🛡️", "Review roles and access permissions."], "support-access": ["🎧", "Manage audited support access."], broadcasts: ["📣", "Manage platform announcements."],
  onboarding: ["🚀", "Review new organization onboarding."], marketing: ["📢", "Manage marketing and outreach."], messages: ["✉️", "Review platform messages."],
  "payment-ops": ["🔄", "Review payment processing operations."], developer: ["💻", "Open developer tools and documentation."],
  "api-explorer": ["🔌", "Review API and webhook integrations."], "feature-flags": ["🚩", "Manage organization capabilities."],
  "rate-limits": ["⏱️", "Review rate limits and abuse protection."], "data-management": ["🗄️", "Manage exports, retention and records."],
  properties: ["🏘️", "Manage properties and your portfolio."], buildings: ["🏢", "Manage buildings across your properties."], units: ["🚪", "Browse units and review occupancy."],
  tenants: ["👥", "Manage tenant details and tenancies."], leases: ["📝", "Review agreements and lease status."], payments: ["💳", "Review payment records and collections."],
  accounting: ["📒", "Review accounting records and requests."], charges: ["🧾", "Manage charges and billing."], "water-bills": ["💧", "Review water usage and bills."],
  expenditures: ["📊", "Manage expenses and approvals."], taxes: ["🏛️", "Review tax charges and records."], reports: ["📈", "Explore reports and performance."],
  issues: ["🛠️", "Track maintenance and completion reports."], inspections: ["📋", "Manage inspections and reports."], "move-outs": ["📦", "Review notices and handovers."],
  notifications: ["🔔", "Read and manage workspace updates."], community: ["📣", "Publish official community notices."], staff: ["👔", "Manage your team and access."],
  security: ["🔐", "Review account security and access."], settings: ["⚙️", "Manage workspace configuration."], help: ["💬", "Find workspace guidance."], support: ["💬", "Get help and manage support requests."],
  organizations: ["🏢", "Review organizations and workspace status."], users: ["👥", "Review platform accounts."], admins: ["🛡️", "Manage platform operators."],
  billing: ["🧾", "Review subscription billing."], subscriptions: ["💼", "Manage plans and subscriptions."], "audit-logs": ["🕘", "Review audited platform activity."],
  "system-health": ["🩺", "Review system and integration health."], backups: ["💾", "Review backup readiness."], jobs: ["⏱️", "Review background jobs and queues."],
  "api-keys": ["🔑", "Manage API credentials."], control: ["🎛️", "Manage website controls."], search: ["🔎", "Search your workspace."],
};

export function mobileWorkspaceLinks(session: AppSession, kind: MobileWorkspaceKind): MobileWorkspaceLink[] {
  if (!mobileWorkspaceAllowed(session, kind)) return [];
  const candidates = kind === "organization" ? [...SIDEBAR_LINKS.map(item => ({ title: item.label, path: item.href, description: "" })),
    { title: "Help & guides", path: "/dashboard/org/help", description: "Find guides for all organization workflows." },
    { title: "Workspace search", path: "/dashboard/org/search", description: "Search records across your organization." },
    { title: "Staff permissions", path: "/dashboard/org/staff/permissions", description: "Manage staff access and mandates." },
    { title: "API keys", path: "/api-keys", description: "Manage organization API credentials." },
  ]
    : [...[...adminNavItems, ...developerNavItems].map(item => ({ title: item.label, path: item.href, description: item.description ?? "" })),
      { title: "Notification queue", path: "/platform/jobs/notifications", description: "Inspect queued and failed deliveries and retry failed notifications." },
      { title: "Provider reports", path: "/platform/service-providers/reports", description: "Review and resolve reported provider accounts." },
    ];
  const navigation = kind === "organization" ? WORKSPACE_NAVIGATION.org : [...WORKSPACE_NAVIGATION["platform-admin"], ...WORKSPACE_NAVIGATION["platform-developer"]];
  return [...new Map(candidates.map(item => [item.path, item])).values()]
    .filter(item => canAccessWorkspacePath(session, item.path))
    .map(item => {
      const key = item.path.split("/")[kind === "organization" ? 3 : 2] ?? "";
      const [emoji, description] = presentation[key] ?? ["🗂️", `Open ${item.title.toLowerCase()} and manage your workspace.`];
      return { ...item, emoji, description: item.description || description, group: navigation.find(group => group.hrefs.includes(item.path === "/platform/service-providers/reports" ? "/platform/service-providers" : item.path === "/platform/jobs/notifications" ? "/platform/jobs" : item.path))?.label ?? "Workspace tools" };
    });
}

/** Exact authorized menu entries only; arbitrary paths and open redirects fail. */
export function mobileWorkspaceEntry(links: MobileWorkspaceLink[], value: string | null, kind: MobileWorkspaceKind) {
  const home = kind === "platform" ? "/platform" : "/dashboard/org";
  return links.find(item => item.path === value)?.path ?? links.find(item => item.path === home)?.path ?? null;
}
