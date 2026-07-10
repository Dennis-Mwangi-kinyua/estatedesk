import type { OrgRole } from "@prisma/client";
import type { HelpWorkspace } from "@/lib/help/help-workspace";

type GuideTopicConfig = {
  slug: string;
  label: string;
  workspaces: readonly HelpWorkspace[];
  orgRoles?: readonly OrgRole[];
  /** When set, each workspace opens a role-safe article instead of the default slug. */
  slugByWorkspace?: Partial<Record<HelpWorkspace, string>>;
};

/**
 * Maps in-app help topics → guide slugs per workspace.
 * Workspace lists are the access boundary: a tenant must never receive
 * org/platform slugs via canAccessGuideSlug, even if they guess the URL.
 *
 * Prefer slugByWorkspace so shared topic keys (rent/water/issues) open
 * role-safe private docs without leaking staff or platform internals.
 */
export const inAppGuideTopics = {
  // ── Shared topic keys used across UI (resolved per workspace) ──────────
  issues: {
    slug: "tenant-issue-tracking",
    label: "How issue tracking works",
    workspaces: ["org", "tenant", "caretaker"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
    slugByWorkspace: {
      tenant: "tenant-maintenance-requests",
      caretaker: "caretaker-issues-and-inspections-guide",
      org: "tenant-issue-tracking",
    },
  },
  water: {
    slug: "water-billing-workflow",
    label: "Water billing workflow",
    workspaces: ["org", "tenant", "caretaker"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
    slugByWorkspace: {
      tenant: "tenant-paying-your-bills",
      caretaker: "caretaker-submitting-meter-readings",
      org: "org-approve-water-readings",
    },
  },
  rent: {
    slug: "rent-tracking-workflow",
    label: "Rent tracking workflow",
    workspaces: ["org", "tenant", "landlord"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "LANDLORD", "TENANT"],
    slugByWorkspace: {
      tenant: "tenant-paying-your-bills",
      org: "org-billing-period-guide",
      landlord: "rent-tracking-workflow",
    },
  },
  moveOut: {
    slug: "move-out-review-checklist",
    label: "Move-out review checklist",
    workspaces: ["org", "tenant", "caretaker"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "TENANT"],
    slugByWorkspace: {
      tenant: "tenant-lease-documents-notices",
      caretaker: "caretaker-issues-and-inspections-guide",
      org: "move-out-review-checklist",
    },
  },

  // ── Tenant-only private docs ───────────────────────────────────────────
  tenantOverview: {
    slug: "tenant-portal-getting-started",
    label: "Getting started",
    workspaces: ["tenant"],
  },
  tenantPay: {
    slug: "tenant-paying-your-bills",
    label: "Paying your bills",
    workspaces: ["tenant"],
  },
  tenantIssues: {
    slug: "tenant-maintenance-requests",
    label: "Maintenance requests",
    workspaces: ["tenant"],
  },
  tenantLease: {
    slug: "tenant-lease-documents-notices",
    label: "Lease & notices",
    workspaces: ["tenant"],
  },

  // ── Caretaker ──────────────────────────────────────────────────────────
  caretakerOverview: {
    slug: "caretaker-workspace-getting-started",
    label: "Getting started",
    workspaces: ["caretaker"],
    orgRoles: ["CARETAKER"],
  },
  caretakerMeters: {
    slug: "caretaker-submitting-meter-readings",
    label: "Meter readings",
    workspaces: ["caretaker"],
    orgRoles: ["CARETAKER"],
  },
  caretakerIssuesGuide: {
    slug: "caretaker-issues-and-inspections-guide",
    label: "Issues & inspections",
    workspaces: ["caretaker"],
    orgRoles: ["CARETAKER"],
  },
  caretaker: {
    slug: "caretaker-field-workflows",
    label: "Field workflows overview",
    workspaces: ["caretaker"],
    orgRoles: ["CARETAKER"],
    slugByWorkspace: {
      caretaker: "caretaker-workspace-getting-started",
    },
  },

  // ── Organization staff private docs ────────────────────────────────────
  orgOverview: {
    slug: "org-workspace-getting-started",
    label: "Workspace overview",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  orgPayments: {
    slug: "org-verify-payments-guide",
    label: "Verify payments",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  orgWater: {
    slug: "org-approve-water-readings",
    label: "Approve water readings",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  orgTenants: {
    slug: "org-manage-tenants-and-leases",
    label: "Tenants & leases",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  orgStaff: {
    slug: "org-staff-roles-overview",
    label: "Staff roles",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER"],
  },
  orgBilling: {
    slug: "org-billing-period-guide",
    label: "Period billing & month-end",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  vacancies: {
    slug: "vacancy-marketing-guide",
    label: "Vacancy marketing",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  portfolio: {
    slug: "kenya-rental-operations",
    label: "Rental operations playbook",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  apiIntegrations: {
    slug: "org-api-integration-guide",
    label: "API integration guide",
    workspaces: ["org"],
    orgRoles: ["ADMIN"],
  },
  diaspora: {
    slug: "diaspora-landlord-management",
    label: "Remote landlord management",
    workspaces: ["org", "landlord"],
    orgRoles: ["ADMIN", "MANAGER", "LANDLORD"],
  },

  // ── Platform admin (privatePlatform) ───────────────────────────────────
  platformAdminHandbook: {
    slug: "platform-admin-handbook",
    label: "Admin handbook",
    workspaces: ["platform"],
  },
  platformSupportPlaybook: {
    slug: "platform-support-playbook",
    label: "Support playbook",
    workspaces: ["platform"],
  },
  platformAdminOps: {
    slug: "platform-admin-operations",
    label: "Administration ops",
    workspaces: ["platform"],
  },
  platformControl: {
    slug: "platform-website-control",
    label: "Website control center",
    workspaces: ["platform"],
  },
} as const;

export type InAppGuideTopic = keyof typeof inAppGuideTopics;

export function getInAppGuideTopic(topic: InAppGuideTopic) {
  return inAppGuideTopics[topic];
}

export function resolveGuideSlugForWorkspace(
  topic: InAppGuideTopic,
  workspace: HelpWorkspace,
) {
  const config = inAppGuideTopics[topic] as GuideTopicConfig;
  return config.slugByWorkspace?.[workspace] ?? config.slug;
}

export function canAccessGuideTopic(
  topic: InAppGuideTopic,
  workspace: HelpWorkspace,
  orgRole?: OrgRole | null,
) {
  const config = inAppGuideTopics[topic] as GuideTopicConfig;
  if (!(config.workspaces as readonly HelpWorkspace[]).includes(workspace)) {
    return false;
  }

  if (workspace === "platform") {
    return true;
  }

  if (
    workspace === "org" ||
    workspace === "landlord" ||
    workspace === "caretaker"
  ) {
    if (!config.orgRoles || !orgRole) return false;
    return (config.orgRoles as readonly OrgRole[]).includes(orgRole);
  }

  // tenant workspace
  return true;
}

export function canAccessGuideSlug(
  slug: string,
  workspace: HelpWorkspace,
  orgRole?: OrgRole | null,
) {
  return listGuideTopicsForWorkspace(workspace, orgRole).some(
    (topic) => resolveGuideSlugForWorkspace(topic, workspace) === slug,
  );
}

export function listGuideTopicsForWorkspace(
  workspace: HelpWorkspace,
  orgRole?: OrgRole | null,
) {
  if (workspace === "platform") {
    return (Object.keys(inAppGuideTopics) as InAppGuideTopic[]).filter((topic) =>
      (inAppGuideTopics[topic].workspaces as readonly HelpWorkspace[]).includes(
        "platform",
      ),
    );
  }

  return (Object.keys(inAppGuideTopics) as InAppGuideTopic[]).filter((topic) =>
    canAccessGuideTopic(topic, workspace, orgRole),
  );
}

/**
 * Hub cards should not list the same article twice when both a shared topic
 * (e.g. rent) and a dedicated topic (tenantPay) resolve to the same slug.
 */
export function listUniqueGuideTopicsForWorkspace(
  workspace: HelpWorkspace,
  orgRole?: OrgRole | null,
) {
  const topics = listGuideTopicsForWorkspace(workspace, orgRole);
  const seen = new Set<string>();
  const unique: InAppGuideTopic[] = [];

  for (const topic of topics) {
    const slug = resolveGuideSlugForWorkspace(topic, workspace);
    if (seen.has(slug)) continue;
    seen.add(slug);
    unique.push(topic);
  }

  return unique;
}
