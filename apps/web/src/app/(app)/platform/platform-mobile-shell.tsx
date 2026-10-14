"use client";

import { SidebarSticker } from "@/components/shared/sidebar-sticker";

import Link from "@/components/navigation/workspace-link";
import { ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogOut, Search } from "@/components/shared/colored-icons";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";
import { HeaderThemeToggle } from "@/components/theme/workspace-theme-toggle";
import { logoutAction } from "@/features/auth/actions/logout-action";
import {
  isNavItemActive,
  type PlatformMode,
  type PlatformNavItem,
} from "./_lib/nav";
import { PlatformBrand } from "./_components/platform-brand";
import { PlatformNavIcon } from "./_components/platform-nav-icon";
import { PlatformModeToggle } from "./_components/platform-mode-toggle";

export default function PlatformMobileShell({
  children,
  navItems,
  fullName,
  mode = "admin",
}: {
  children: ReactNode;
  navItems: readonly PlatformNavItem[];
  fullName: string;
  mode?: PlatformMode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const [query, setQuery] = useState("");
  const drawerRef = useRef<HTMLElement>(null);
  const visibleItems = navItems.filter((item) => `${item.label} ${item.description ?? ""}`.toLowerCase().includes(query.toLowerCase().trim()));
  const tabs = navItems.filter((item) => (mode === "admin"
    ? ["/platform", "/platform/organizations", "/platform/payments"]
    : ["/platform/developer", "/platform/system-health", "/platform/jobs"]).includes(item.href));
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isDeveloper = mode === "developer";

  const closeMenu = useCallback(() => {
    menuButtonRef.current?.focus();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    drawerRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const controls = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex="0"]') ?? []).filter((element) => !element.hasAttribute("disabled"));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    // Close drawer after navigation without sync setState in effect body.
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="platform-mobile-header ed-shell-panel flex shrink-0 flex-col border-b pt-safe lg:hidden">
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
            <PlatformBrand mode={mode} />

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <HeaderThemeToggle />
              <button data-workspace-action="true"
                ref={menuButtonRef}
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls={panelId}
                className="ios-button ed-soft-button inline-flex h-11 w-11 items-center justify-center border shadow-sm transition active:scale-[0.98]"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Always-visible mode switch on phones — critical for Admin ↔ Developer */}
          <div className="border-t border-border/70 px-3 py-2 sm:px-4">
            <PlatformModeToggle variant="mobile" className="w-full" />
          </div>
        </header>

        <div inert={open} className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
        <nav aria-label="Quick navigation" inert={open} className="platform-mobile-dock ed-shell-panel grid shrink-0 grid-cols-4 gap-1 border-t border-border px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
          {tabs.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const tone = item.href.includes("payments") || item.href.includes("system-health") ? "emerald" : item.href.includes("organizations") || item.href.includes("jobs") ? "teal" : "sky";
            return <Link data-dock-tone={tone} key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`platform-dock-item flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><span className="platform-dock-icon"><PlatformNavIcon label={item.href} className="h-6 w-6" /></span><span>{item.href === "/platform/organizations" ? "Orgs" : item.href === "/platform/developer" ? "Home" : item.label}</span></Link>;
          })}
          <button data-workspace-action="true" type="button" onClick={() => setOpen(true)} data-dock-tone="slate" aria-label="More navigation" aria-expanded={open} aria-controls={panelId} className="platform-dock-item flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"><span className="platform-dock-icon"><PlatformNavIcon label="more" className="h-6 w-6" /></span><span>More</span></button>
        </nav>
      </div>

      <button data-workspace-action="true"
        type="button"
        aria-label="Close menu overlay"
        onClick={closeMenu}
        className={`workspace-navigation-backdrop fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-md transition-opacity duration-300 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id={panelId}
        ref={drawerRef}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label="Platform navigation"
        aria-hidden={!open}
        inert={!open}
        className={`platform-navigation-drawer workspace-navigation-panel ed-shell-panel fixed right-0 top-0 z-50 h-full w-[84%] max-w-[360px] border-l shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col bg-card/95 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <PlatformBrand mode={mode} />

            <button data-workspace-action="true"
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="ios-button ed-soft-button inline-flex h-10 w-10 items-center justify-center border shadow-sm transition active:scale-[0.98]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="mx-3 mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a tool…" aria-label="Filter navigation" className="min-w-0 w-full bg-transparent py-3 text-base outline-none" />
          </label>
          <nav className="flex-1 space-y-1 overflow-auto p-3">
            {visibleItems.length === 0 && <p role="status" className="px-3 py-6 text-sm text-muted-foreground">No tools found. Try another name.</p>}
            {visibleItems.map((item) => {
              const active = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={`platform-sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? isDeveloper
                        ? "bg-teal-600 text-white"
                        : "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <SidebarSticker href={item.href} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.superAdminOnly ? (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      SA
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-border p-4">
            <p className="break-words text-sm font-semibold text-foreground">{fullName}</p>
            <InAppHelpNav workspace="platform" compact />
            <form data-logout-form action={logoutAction}>
              <button data-action-kind="destructive" data-workspace-action="true"
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99]"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
