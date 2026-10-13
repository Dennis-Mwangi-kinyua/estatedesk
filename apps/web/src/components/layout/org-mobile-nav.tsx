"use client";

import { usePathname } from "next/navigation";
import { DeferredLink } from "@/components/navigation/app-links";
import { useWorkspaceAccess } from "@/components/navigation/workspace-link";
import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import { canDiscoverWorkspaceHref } from "@/lib/permissions/workspace-access";
import { SIDEBAR_LINKS, isActivePath, type OrgRole } from "./org-sidebar-links";

const PRIORITY: Record<OrgRole, string[]> = {
  ADMIN: ["Overview", "Properties", "Tenants", "Payments"],
  MANAGER: ["Overview", "Properties", "Tenants", "Payments"],
  OFFICE: ["Overview", "Tenants", "Issues", "Notifications"],
  ACCOUNTANT: ["Overview", "Payments", "Accounting", "Reports"],
  CARETAKER: ["Overview", "Issues", "Units", "Buildings"],
  TENANT: ["Overview"],
};

export function OrgMobileNav({
  role,
  menuOpen = false,
  onMenuClick,
}: {
  role: OrgRole;
  menuOpen?: boolean;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const access = useWorkspaceAccess();
  const links = SIDEBAR_LINKS
    .filter(item => PRIORITY[role].includes(item.label))
    .filter(item => !access || canDiscoverWorkspaceHref(access, item.href))
    .sort((a, b) => PRIORITY[role].indexOf(a.label) - PRIORITY[role].indexOf(b.label));

  return (
    <nav aria-label="Organisation quick navigation" className="tenant-mobile-dock org-mobile-dock fixed inset-x-0 bottom-0 z-[85] lg:hidden">
      {links.map(({ href, label }) => {
        const active = isActivePath(pathname, href);
        const shortLabel = label === "Overview" ? "Home" : label;
        return (
          <DeferredLink key={href} href={href} aria-current={active ? "page" : undefined} className="tenant-mobile-dock__item">
            <span className="tenant-mobile-dock__icon"><WorkspaceIcon label={href} className="h-6 w-6" /></span>
            <span>{shortLabel}</span>
          </DeferredLink>
        );
      })}
      <button type="button" onClick={onMenuClick} aria-label="Open organisation navigation" aria-expanded={menuOpen} className="tenant-mobile-dock__item">
        <span className="tenant-mobile-dock__icon"><WorkspaceIcon label="more" className="h-6 w-6" /></span>
        <span>More</span>
      </button>
    </nav>
  );
}
