"use client";

import { usePathname } from "next/navigation";
import { House, WalletCards, Wrench, UserRound, LayoutGrid } from "lucide-react";
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
        const Icon = label === "Overview" ? House : label === "Payments" ? WalletCards : label === "Profile" ? UserRound : Wrench;
        return <DeferredLink key={href} href={href} aria-current={active ? "page" : undefined} className="tenant-mobile-dock__item">
          <span className="tenant-mobile-dock__icon"><Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} /></span>
          <span>{label === "Maintenance & repairs" ? "Repairs" : label === "Overview" ? "Home" : label}</span>
        </DeferredLink>;
      })}
      <button type="button" onClick={onMenuClick} aria-label="Open tenant navigation" aria-expanded={menuOpen} className="tenant-mobile-dock__item">
        <span className="tenant-mobile-dock__icon"><LayoutGrid aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} /></span>
        <span>More</span>
      </button>
    </nav>
  );
}
