"use client";

import { usePathname } from "next/navigation";
import { WorkspaceIcon } from "@/components/shared/workspace-icon";
import { DeferredLink } from "@/components/navigation/app-links";
import { getTenantSidebarLinks, isTenantActivePath } from "./tenant-sidebar-links";

export function TenantMobileNav({ hasActiveLease, onMenuClick, menuOpen = false }: { hasActiveLease: boolean; onMenuClick: () => void; menuOpen?: boolean }) {
  const pathname = usePathname();
  const order = ["Overview", "Payments", "Maintenance & repairs", "Profile"];
  const links = getTenantSidebarLinks(hasActiveLease)
    .filter(item => order.includes(item.label))
    .sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));

  return (
    <nav aria-label="Tenant quick navigation" className="tenant-mobile-dock fixed inset-x-0 bottom-0 z-[85] lg:hidden">
      {links.map(({ href, label }) => {
        const active = isTenantActivePath(pathname, href);
        return <DeferredLink key={href} href={href} aria-current={active ? "page" : undefined} className="tenant-mobile-dock__item">
          <span className="tenant-mobile-dock__icon"><WorkspaceIcon label={href} className="h-6 w-6" /></span>
          <span>{label === "Maintenance & repairs" ? "Repairs" : label === "Overview" ? "Home" : label}</span>
        </DeferredLink>;
      })}
      <button type="button" onClick={onMenuClick} aria-label="Open tenant navigation" aria-expanded={menuOpen} className="tenant-mobile-dock__item">
        <span className="tenant-mobile-dock__icon"><WorkspaceIcon label="more" className="h-6 w-6" /></span>
        <span>More</span>
      </button>
    </nav>
  );
}
