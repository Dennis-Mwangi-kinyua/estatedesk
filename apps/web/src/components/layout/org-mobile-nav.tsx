import { activeNavigationHref } from "@/lib/navigation/workspace-navigation";
import { usePathname } from "next/navigation";
import { DeferredLink } from "@/components/navigation/app-links";
import { useWorkspaceAccess } from "@/components/navigation/workspace-link";
import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import { canDiscoverWorkspaceHref } from "@/lib/permissions/workspace-access";
import { SIDEBAR_LINKS, type OrgRole } from "./org-sidebar-links";

const PRIORITY: Record<OrgRole, readonly string[]> = {
  ADMIN: ["/dashboard/org", "/dashboard/org/properties", "/dashboard/org/tenants", "/dashboard/org/payments"],
  MANAGER: ["/dashboard/org", "/dashboard/org/properties", "/dashboard/org/tenants", "/dashboard/org/payments"],
  OFFICE: ["/dashboard/org/tenants", "/dashboard/org/payments", "/dashboard/org/issues", "/dashboard/org/notifications"],
  ACCOUNTANT: ["/dashboard/org/accounting", "/dashboard/org/payments", "/dashboard/org/accounting/requests", "/dashboard/org/reports"],
  CARETAKER: ["/dashboard/caretaker/today"],
  TENANT: ["/dashboard/tenant"],
  SECURITY: ["/dashboard/gate", "/dashboard/security"],
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
    .filter(item => PRIORITY[role].includes(item.href))
    .filter(item => access ? canDiscoverWorkspaceHref(access, item.href) : item.roles.includes(role))
    .sort((a, b) => PRIORITY[role].indexOf(a.href) - PRIORITY[role].indexOf(b.href));

  const activeHref = activeNavigationHref(pathname, links);

  return (
    <nav aria-label="Organisation quick navigation" className="tenant-mobile-dock org-mobile-dock fixed inset-x-0 bottom-0 z-[85] lg:hidden">
      {links.map(({ href, label }) => {
        const active = href === activeHref;
        const shortLabel = label === "Overview" ? "Home" : label === "Accounting requests" ? "Requests" : label;
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
