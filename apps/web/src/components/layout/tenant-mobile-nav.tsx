"use client";

import { WorkspaceIcon } from "@/components/shared/workspace-icon";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { getTenantSidebarLinks, isTenantActivePath } from "./tenant-sidebar-links";

export function TenantMobileNav({ hasActiveLease, onMenuClick }: { hasActiveLease: boolean; onMenuClick: () => void }) {
  const pathname = usePathname();
  const links = getTenantSidebarLinks(hasActiveLease).filter(item =>
    ["Overview", "Payments", "Maintenance & repairs", "Profile"].includes(item.label),
  );

  return (
    <nav aria-label="Tenant quick navigation" className="fixed inset-x-0 bottom-0 z-[85] flex border-t border-border bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
      {links.map(({ href, label }) => {
        const active = isTenantActivePath(pathname, href);
        return <DeferredLink key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
          <span aria-hidden="true"><WorkspaceIcon label={href} className="h-5 w-5" /></span>
          <span>{label === "Maintenance & repairs" ? "Repairs" : label === "Overview" ? "Home" : label}</span>
        </DeferredLink>;
      })}
      <button type="button" onClick={onMenuClick} aria-label="Open tenant navigation" className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
        <Menu aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
        <span>More</span>
      </button>
    </nav>
  );
}
