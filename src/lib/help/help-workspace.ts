import type { OrgRole } from "@prisma/client";

export const helpWorkspaces = [
  "org",
  "tenant",
  "caretaker",
  "landlord",
  "platform",
] as const;

export type HelpWorkspace = (typeof helpWorkspaces)[number];

export const helpWorkspacePaths: Record<HelpWorkspace, string> = {
  org: "/dashboard/org/help",
  tenant: "/dashboard/tenant/help",
  caretaker: "/dashboard/caretaker/help",
  landlord: "/dashboard/landlord/help",
  platform: "/platform/help",
};

export function getInAppHelpHubPath(workspace: HelpWorkspace) {
  return helpWorkspacePaths[workspace];
}

export function getInAppHelpArticlePath(workspace: HelpWorkspace, slug: string) {
  return `${helpWorkspacePaths[workspace]}/${slug}`;
}

export function isHelpWorkspace(value: string): value is HelpWorkspace {
  return (helpWorkspaces as readonly string[]).includes(value);
}

const workspaceGuards: Record<
  HelpWorkspace,
  { label: string; allowedOrgRoles?: readonly OrgRole[] }
> = {
  org: {
    label: "Organization workspace",
    allowedOrgRoles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  tenant: {
    label: "Tenant portal",
    allowedOrgRoles: ["TENANT"],
  },
  caretaker: {
    label: "Caretaker workspace",
    allowedOrgRoles: ["CARETAKER"],
  },
  landlord: {
    label: "Landlord workspace",
    allowedOrgRoles: ["LANDLORD"],
  },
  platform: {
    label: "Platform control plane",
  },
};

export function canAccessHelpWorkspace(
  workspace: HelpWorkspace,
  orgRole: OrgRole | null | undefined,
) {
  const allowedRoles = workspaceGuards[workspace].allowedOrgRoles;
  if (!allowedRoles) return false;
  return Boolean(orgRole && allowedRoles.includes(orgRole));
}

export function getHelpWorkspaceLabel(workspace: HelpWorkspace) {
  return workspaceGuards[workspace].label;
}