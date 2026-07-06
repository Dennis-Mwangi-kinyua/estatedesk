import type { OrgRole } from "@prisma/client";
import type { HelpWorkspace } from "@/lib/help/help-workspace";

type GuideTopicConfig = {
  slug: string;
  label: string;
  workspaces: readonly HelpWorkspace[];
  orgRoles?: readonly OrgRole[];
};

export const inAppGuideTopics = {
  issues: {
    slug: "tenant-issue-tracking",
    label: "How issue tracking works",
    workspaces: ["org", "tenant", "caretaker"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  water: {
    slug: "water-billing-workflow",
    label: "Water billing workflow",
    workspaces: ["org", "tenant", "caretaker"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
  },
  rent: {
    slug: "rent-tracking-workflow",
    label: "Rent tracking workflow",
    workspaces: ["org", "tenant", "landlord"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "LANDLORD"],
  },
  caretaker: {
    slug: "caretaker-field-workflows",
    label: "Caretaker field workflows",
    workspaces: ["caretaker"],
    orgRoles: ["CARETAKER"],
  },
  vacancies: {
    slug: "vacancy-marketing-guide",
    label: "Vacancy marketing guide",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  portfolio: {
    slug: "kenya-rental-operations",
    label: "Kenya rental operations",
    workspaces: ["org"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  moveOut: {
    slug: "move-out-review-checklist",
    label: "Move-out review checklist",
    workspaces: ["org", "tenant", "caretaker"],
    orgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  diaspora: {
    slug: "diaspora-landlord-management",
    label: "Remote landlord management",
    workspaces: ["org", "landlord"],
    orgRoles: ["ADMIN", "MANAGER", "LANDLORD"],
  },
  apiIntegrations: {
    slug: "org-api-integration-guide",
    label: "API integration guide",
    workspaces: ["org"],
    orgRoles: ["ADMIN"],
  },
} as const;

export type InAppGuideTopic = keyof typeof inAppGuideTopics;

export function getInAppGuideTopic(topic: InAppGuideTopic) {
  return inAppGuideTopics[topic];
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

  if (workspace === "org" || workspace === "landlord") {
    if (!config.orgRoles || !orgRole) return false;
    return (config.orgRoles as readonly OrgRole[]).includes(orgRole);
  }

  return true;
}

export function canAccessGuideSlug(
  slug: string,
  workspace: HelpWorkspace,
  orgRole?: OrgRole | null,
) {
  return listGuideTopicsForWorkspace(workspace, orgRole).some(
    (topic) => inAppGuideTopics[topic].slug === slug,
  );
}

export function listGuideTopicsForWorkspace(
  workspace: HelpWorkspace,
  orgRole?: OrgRole | null,
) {
  if (workspace === "platform") {
    return Object.keys(inAppGuideTopics) as InAppGuideTopic[];
  }

  return (Object.keys(inAppGuideTopics) as InAppGuideTopic[]).filter((topic) =>
    canAccessGuideTopic(topic, workspace, orgRole),
  );
}