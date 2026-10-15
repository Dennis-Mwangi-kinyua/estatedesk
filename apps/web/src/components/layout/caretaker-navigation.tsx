import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HoverPrefetchLink } from "@/components/navigation/app-links";
import { useWorkspaceAccess } from "@/components/navigation/workspace-link";
import { NavigationSections } from "@/components/navigation/navigation-sections";
import { SidebarSticker } from "@/components/shared/sidebar-sticker";
import { canDiscoverWorkspaceHref } from "@/lib/permissions/workspace-access";
import { WORKSPACE_NAVIGATION, activeNavigationHref } from "@/lib/navigation/workspace-navigation";
import { CARETAKER_NAV_ITEMS } from "@/app/(app)/dashboard/caretaker/_lib/i18n";
import { CaretakerNavLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-nav-label";

export function CaretakerNavigation({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const access = useWorkspaceAccess();
  const items = useMemo(() => CARETAKER_NAV_ITEMS.filter(item => !access || canDiscoverWorkspaceHref(access, item.href)), [access]);
  const activeHref = activeNavigationHref(pathname, items);

  return <nav aria-label="Caretaker navigation">
    <NavigationSections items={items} sections={WORKSPACE_NAVIGATION.caretaker} renderItem={item => {
      const active = item.href === activeHref;
      return <HoverPrefetchLink href={item.href} prefetch={mobile ? false : undefined} onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "ed-nav-item-active" : "ed-nav-item"}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${active ? "ed-nav-icon-active" : "ed-nav-icon"}`}><SidebarSticker href={item.href} /></span>
        <span className="min-w-0 flex-1"><CaretakerNavLabel labelKey={item.labelKey} /></span>
      </HoverPrefetchLink>;
    }} />
  </nav>;
}
