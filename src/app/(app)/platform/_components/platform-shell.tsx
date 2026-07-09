"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import {
  Building2,
  Code2,
  LogOut,
  MessageSquareText,
} from "lucide-react";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";
import { HeaderThemeToggle } from "@/components/theme/theme-toggle";
import { logoutAction } from "@/features/auth/actions/logout-action";
import {
  getNavItemsForMode,
  isNavItemActive,
  modeMeta,
  type PlatformMode,
} from "../_lib/nav";
import { platformNavIconMap } from "../_lib/icons";
import { DeveloperSensitiveBanner } from "./developer-sensitive-banner";
import { PlatformModeProvider, usePlatformMode } from "./platform-mode-context";
import { PlatformModeToggle } from "./platform-mode-toggle";
import PlatformMobileShell from "../platform-mobile-shell";

function PlatformShellInner({
  children,
  fullName,
  isSuperAdmin,
}: {
  children: ReactNode;
  fullName: string;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const { mode } = usePlatformMode();
  const navItems = useMemo(
    () => getNavItemsForMode(mode, { isSuperAdmin }),
    [mode, isSuperAdmin],
  );
  const meta = modeMeta[mode];
  const isDeveloper = mode === "developer";
  const BrandIcon = isDeveloper ? Code2 : Building2;

  return (
    <div
      className={[
        "app-mobile-canvas ed-mobile-surface h-dvh overflow-hidden text-foreground",
        isDeveloper ? "platform-shell-developer" : "platform-shell-admin",
      ].join(" ")}
    >
      <div className="flex h-dvh overflow-hidden">
        <aside className="ed-shell-panel fixed bottom-0 left-0 top-0 z-40 hidden w-[280px] border-r lg:flex lg:flex-col">
          <div className="shrink-0 border-b border-border px-5 py-5">
            <div className="flex items-center gap-3">
              <div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-lg shadow-sm",
                  isDeveloper
                    ? "bg-violet-600 text-white"
                    : "ed-brand-mark bg-primary text-primary-foreground",
                ].join(" ")}
              >
                <BrandIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                  EstateDesk
                </h1>
                <p className="text-xs text-muted-foreground">{meta.brandSubtitle}</p>
              </div>
            </div>

            <div className="mt-4">
              <PlatformModeToggle variant="sidebar" />
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const Icon = platformNavIconMap[item.icon];
              const active = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? isDeveloper
                        ? "bg-violet-600 text-white dark:bg-violet-500"
                        : "ed-nav-item-active bg-primary text-primary-foreground"
                      : "ed-nav-item text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                      active
                        ? "bg-white/15 text-white"
                        : "ed-nav-icon bg-muted text-muted-foreground group-hover:bg-card group-hover:text-primary",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.superAdminOnly ? (
                    <span
                      className={[
                        "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-amber-500/15 text-amber-800 dark:text-amber-200",
                      ].join(" ")}
                    >
                      SA
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-border p-4">
            <div className="mb-3">
              <InAppHelpNav workspace="platform" compact />
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </aside>

        <PlatformMobileShell
          navItems={navItems}
          fullName={fullName}
          mode={mode}
        >
          <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden lg:pl-[280px]">
            <header className="ed-shell-panel hidden h-[76px] shrink-0 border-b px-6 lg:block">
              <div className="flex h-full items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
                      {meta.headerTitle}
                    </h2>
                    <span
                      className={[
                        "hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex",
                        isDeveloper
                          ? "bg-violet-500/15 text-violet-800 dark:text-violet-200"
                          : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {meta.shortLabel}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {meta.headerDescription}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="hidden xl:block">
                    <PlatformModeToggle variant="header" />
                  </div>
                  <HeaderThemeToggle />
                  <div className="ed-soft-button flex items-center gap-3 rounded-lg border px-4 py-2 shadow-sm">
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    <span className="max-w-[220px] truncate text-sm font-medium text-foreground">
                      {fullName}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <section className="min-h-0 flex-1 overflow-hidden p-2 sm:p-4 lg:p-6">
              <div className="ios-panel h-full overflow-hidden rounded-xl border border-border bg-card/90 shadow-sm backdrop-blur-sm dark:bg-card/80 sm:rounded-xl">
                <div className="platform-theme-content ed-mobile-content h-full overflow-auto overscroll-y-contain p-3 text-foreground sm:p-5 lg:p-6">
                  <DeveloperSensitiveBanner isSuperAdmin={isSuperAdmin} />
                  {children}
                </div>
              </div>
            </section>

            <footer className="ed-shell-panel hidden h-11 shrink-0 border-t px-6 lg:block">
              <div className="flex h-full items-center justify-between gap-4">
                <p className="truncate text-xs text-muted-foreground">
                  © {new Date().getFullYear()} EstateDesk{" "}
                  {isDeveloper ? "developer portal" : "platform control plane"}
                  <span className="ml-2 hidden text-muted-foreground/80 lg:inline">
                    · Alt+Shift+A/D mode switch
                  </span>
                </p>

                <nav
                  aria-label="Platform footer navigation"
                  className="flex shrink-0 items-center gap-2"
                >
                  {isDeveloper ? (
                    <>
                      <FooterLink href="/platform/system-health">Health</FooterLink>
                      <FooterLink href="/platform/api-explorer">APIs</FooterLink>
                      <FooterLink href="/platform/feature-flags">Flags</FooterLink>
                    </>
                  ) : (
                    <>
                      <FooterLink href="/platform/organizations">Orgs</FooterLink>
                      <FooterLink href="/platform/security">Security</FooterLink>
                      <FooterLink href="/platform/settings">Settings</FooterLink>
                    </>
                  )}
                </nav>
              </div>
            </footer>
          </main>
        </PlatformMobileShell>
      </div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export function PlatformShell({
  children,
  fullName,
  isSuperAdmin,
  initialPreferredMode = "admin",
}: {
  children: ReactNode;
  fullName: string;
  isSuperAdmin: boolean;
  initialPreferredMode?: PlatformMode;
}) {
  return (
    <PlatformModeProvider initialPreferredMode={initialPreferredMode}>
      <PlatformShellInner fullName={fullName} isSuperAdmin={isSuperAdmin}>
        {children}
      </PlatformShellInner>
    </PlatformModeProvider>
  );
}
