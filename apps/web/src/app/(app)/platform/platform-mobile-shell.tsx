"use client";

import Link from "next/link";
import { ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Building2, Code2, LogOut, Menu, X } from "lucide-react";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";
import { HeaderThemeToggle } from "@/components/theme/theme-toggle";
import { logoutAction } from "@/features/auth/actions/logout-action";
import {
  isNavItemActive,
  modeMeta,
  type PlatformMode,
  type PlatformNavItem,
} from "./_lib/nav";
import { platformNavIconMap } from "./_lib/icons";
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const meta = modeMeta[mode];
  const isDeveloper = mode === "developer";
  const BrandIcon = isDeveloper ? Code2 : Building2;

  const closeMenu = useCallback(() => {
    menuButtonRef.current?.focus();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
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
        <header className="ed-shell-panel flex shrink-0 flex-col border-b pt-safe lg:hidden">
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  isDeveloper
                    ? "bg-violet-600 text-white"
                    : "ed-brand-mark bg-primary text-primary-foreground",
                ].join(" ")}
              >
                <BrandIcon className="h-4 w-4" />
              </span>

              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
                  EstateDesk
                </h1>
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  {meta.brandSubtitle}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <HeaderThemeToggle />
              <button
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

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>

      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={closeMenu}
        className={`fixed inset-0 z-40 bg-background/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id={panelId}
        aria-hidden={!open}
        inert={!open}
        className={`ed-shell-panel fixed right-0 top-0 z-50 h-full w-[84%] max-w-[360px] border-l shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col bg-card/95 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                {meta.headerTitle}
              </h2>
              <p className="truncate text-xs text-muted-foreground">{fullName}</p>
            </div>

            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="ios-button ed-soft-button inline-flex h-10 w-10 items-center justify-center border shadow-sm transition active:scale-[0.98]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-auto p-3">
            {navItems.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = platformNavIconMap[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? isDeveloper
                        ? "bg-violet-600 text-white"
                        : "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-md ${
                      active
                        ? "bg-white/12 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
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
            <InAppHelpNav workspace="platform" compact />
            <form action={logoutAction}>
              <button
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
