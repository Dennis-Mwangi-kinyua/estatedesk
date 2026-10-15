import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HoverPrefetchLink } from "@/components/navigation/app-links";
import { NavigationSections } from "@/components/navigation/navigation-sections";
import { SidebarSticker } from "@/components/shared/sidebar-sticker";
import { WORKSPACE_NAVIGATION, activeNavigationHref } from "@/lib/navigation/workspace-navigation";
import type { PlatformMode, PlatformNavItem } from "../_lib/nav";

export function PlatformNavigation({ items, mode, query, onNavigate, mobile = false }: {
  items: readonly PlatformNavItem[];
  mode: PlatformMode;
  query: string;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items.filter(item => `${item.label} ${item.description ?? ""}`.toLowerCase().includes(search));
  }, [items, query]);
  // Searching should not make a parent destination appear current.
  const activeHref = activeNavigationHref(pathname, items);
  if (!visible.length) return <p role="status" className="px-3 py-4 text-sm text-muted-foreground">No matching navigation. Try another search.</p>;
  return <NavigationSections items={visible} sections={WORKSPACE_NAVIGATION[`platform-${mode}`]} renderItem={item => {
    const active = item.href === activeHref;
    return <HoverPrefetchLink href={item.href} prefetch={mobile ? false : undefined} onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`platform-sidebar-link group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? mode === "developer" ? "bg-teal-600 text-white dark:bg-teal-500" : "ed-nav-item-active bg-primary text-primary-foreground" : "ed-nav-item text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}>
      <SidebarSticker href={item.href} />
      <span className="min-w-0 flex-1">{item.label}</span>
      {item.superAdminOnly ? <span aria-label="Super admin only" className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${active ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-800 dark:text-amber-200"}`}>SA</span> : null}
    </HoverPrefetchLink>;
  }} />;
}
