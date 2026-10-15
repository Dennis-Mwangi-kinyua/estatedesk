import { useWorkspaceAccess } from "@/components/navigation/workspace-link";
import { canDiscoverWorkspaceHref } from "@/lib/permissions/workspace-access";
import { useCallback, useMemo, useRef } from "react";
import { useNavigationDialog } from "@/components/navigation/use-navigation-dialog";
import { usePathname } from "next/navigation";
import { NavigationSections } from "@/components/navigation/navigation-sections";
import { WORKSPACE_NAVIGATION, activeNavigationHref } from "@/lib/navigation/workspace-navigation";
import { ROLE_HOME_PATHS } from "@/lib/auth/redirect-after-login";
import { X } from "lucide-react";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";
import {
  SIDEBAR_LINKS,
  type OrgRole,
} from "./org-sidebar-links";
import {
  LogoutButton,
  SidebarBrand,
  SidebarNavItem,
} from "./org-sidebar-parts";

export type { OrgRole } from "./org-sidebar-links";

type OrgDashboardSidebarProps = {
  organizationName: string;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  role?: OrgRole;
};

export function OrgDashboardSidebar({
  organizationName,
  mobileOpen,
  setMobileOpen,
  role = "ADMIN",
}: OrgDashboardSidebarProps) {
  const pathname = usePathname();
  const access = useWorkspaceAccess();
  const drawerRef = useRef<HTMLDivElement>(null);

  const visibleLinks = useMemo(() => {
    return SIDEBAR_LINKS.filter((item) => access ? canDiscoverWorkspaceHref(access, item.href) : item.roles.includes(role));
  }, [role, access]);

  const activeHref = activeNavigationHref(pathname, visibleLinks);
  const homeHref = ROLE_HOME_PATHS[role];

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, [setMobileOpen]);

  useNavigationDialog(mobileOpen, drawerRef, closeMobile);

  return (
    <>
      <aside className="ed-shell-panel fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r lg:flex">
        <div className="border-b border-slate-200 px-5 py-5 dark:border-white/10">
          <SidebarBrand organizationName={organizationName} homeHref={homeHref} />
        </div>

        <nav aria-label="Organisation navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavigationSections items={visibleLinks} sections={WORKSPACE_NAVIGATION.org}
            renderItem={item => <SidebarNavItem item={item} pathname={pathname} active={item.href === activeHref} />} />
        </nav>

        <div className="space-y-2 p-4">
          {role !== "SECURITY" && <InAppHelpNav workspace="org" orgRole={role} />}
          <LogoutButton />
        </div>
      </aside>

      <div
        inert={!mobileOpen}
        aria-hidden={!mobileOpen}
        className={[
          "fixed inset-0 z-[120] lg:hidden transition-all duration-300 ease-out",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        <button data-workspace-action="true"
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeMobile}
          className={[
            "workspace-navigation-backdrop absolute inset-0 bg-slate-950/25 backdrop-blur-md transition-opacity duration-300 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <div
          ref={drawerRef}
          role="dialog"
          aria-modal={mobileOpen ? true : undefined}
          aria-label="Workspace navigation"
          tabIndex={-1}
          className={[
            "system-glass-sidebar absolute inset-y-0 left-0 flex w-[90%] max-w-[390px] flex-col border-r border-slate-200 bg-white/86 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-slate-950/86",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 pb-4 pt-safe dark:border-white/10">
                <div className="min-w-0">
                  <SidebarBrand organizationName={organizationName} homeHref={homeHref} />
                </div>

                <button data-workspace-action="true"
                  type="button"
                  onClick={closeMobile}
                  aria-label="Close navigation"
                  className="ios-button ed-soft-button touch-target inline-flex items-center justify-center border shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav aria-label="Organisation navigation" className="ios-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 overscroll-contain">
              <div className="space-y-2 pb-2">
                <NavigationSections items={visibleLinks} sections={WORKSPACE_NAVIGATION.org}
                  renderItem={item => <SidebarNavItem item={item} pathname={pathname} active={item.href === activeHref} mobile onNavigate={closeMobile} />} />
              </div>
            </nav>

            <div className="shrink-0 border-t border-slate-200/80 px-3 pb-4 pt-3 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] dark:border-white/10">
              <div className="space-y-2 rounded-2xl bg-slate-50 p-2 dark:bg-slate-900">
                {role !== "SECURITY" && <InAppHelpNav workspace="org" orgRole={role} compact />}
                <LogoutButton mobile onClick={closeMobile} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}