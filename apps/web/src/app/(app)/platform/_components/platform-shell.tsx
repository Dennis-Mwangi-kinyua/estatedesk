"use client";
import { TodayLink } from "@/components/shared/today-link";
import { PlatformBrand } from "./platform-brand";
import { WorkspaceIdentity } from "@/components/shared/workspace-identity";

import { PlatformNavigation } from "./platform-navigation";

import "../platform-glass.css";
import "../admin-glass.css";

import Link from "@/components/navigation/workspace-link";
import { ReactNode, useMemo, useState } from "react";
import { LogOut } from "@/components/shared/colored-icons";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";
import { HeaderThemeToggle } from "@/components/theme/workspace-theme-toggle";
import { logoutAction } from "@/features/auth/actions/logout-action";
import {
  getPlatformNavItems,
} from "../_lib/nav";
import { DeveloperSensitiveBanner } from "./developer-sensitive-banner";
import PlatformMobileShell from "../platform-mobile-shell";
import { PlatformAppearanceSwitch, usePlatformAppearance } from "./platform-appearance-switch";

function PlatformShellInner({
  children,
  fullName,
  isSuperAdmin,
  pendingProviderCount,
  pendingDemoCount = 0,
}: {
  children: ReactNode;
  fullName: string;
  isSuperAdmin: boolean;
  pendingProviderCount: number;
  pendingDemoCount?: number;
}) {
  const [navQuery, setNavQuery] = useState("");
  const mode = "admin" as const;
  const navItems = useMemo(
    () => getPlatformNavItems({ isSuperAdmin }).map((item) =>
      item.href === "/platform/service-providers"
        ? { ...item, badgeCount: pendingProviderCount }
        : item.href === "/platform/demos" ? { ...item, badgeCount: pendingDemoCount } : item,
    ),
    [isSuperAdmin, pendingProviderCount, pendingDemoCount],
  );
  const meta = { headerTitle: "Platform command centre", shortLabel: "Unified", headerDescription: "Customers, revenue, security and system operations in one place" };
  const { appearance, isGlass } = usePlatformAppearance(true);

  return (
    <div
      className={[
        "app-mobile-canvas ed-mobile-surface h-dvh overflow-hidden text-foreground",
        "platform-shell-admin",
        isGlass ? "platform-ui-glass" : "",
      ].join(" ")}
    >
      <div className="flex h-dvh overflow-hidden">
        <aside aria-label="Platform sidebar" className="platform-sidebar ed-shell-panel fixed bottom-0 left-0 top-0 z-40 hidden w-[280px] border-r lg:flex lg:flex-col">
          <div className="flex h-[76px] shrink-0 items-center border-b border-border px-5">
            <PlatformBrand />
          </div>

          <label className="mx-3 mt-3"><span className="sr-only">Find an admin tool</span><input type="search" placeholder="Find a tool…" value={navQuery} onChange={(event) => setNavQuery(event.target.value)} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-primary" /></label>
          <nav aria-label="Platform navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <TodayLink />
            <PlatformNavigation items={navItems} mode={mode} query={navQuery} />
          </nav>

          <div className="shrink-0 border-t border-border p-4">
            <div className="mb-3">
              <InAppHelpNav workspace="platform" compact />
            </div>

            <form data-logout-form action={logoutAction}>
              <button data-action-kind="destructive" data-workspace-action="true"
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
          appearanceControl={<PlatformAppearanceSwitch appearance={appearance} />}
          showThemeToggle={!isGlass}
        >
          <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden lg:pl-[280px]">
            <header className="platform-desktop-header ed-shell-panel hidden h-[76px] shrink-0 border-b px-6 lg:block">
              <div className="flex h-full items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
                      {meta.headerTitle}
                    </h2>
                    <span
                      className={[
                        "hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex",
                        "bg-muted text-muted-foreground",
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
                  <PlatformAppearanceSwitch appearance={appearance} />
                  {!isGlass && <HeaderThemeToggle />}
                  <TodayLink compact />
                  <WorkspaceIdentity name={fullName} role={isSuperAdmin ? "Super platform admin" : "Platform operator"} />

                </div>
              </div>
            </header>

            <section className="min-h-0 min-w-0 flex-1 overflow-hidden p-0 sm:p-3 lg:p-6">
              <div className="platform-content-frame ios-panel h-full min-w-0 overflow-hidden rounded-none border-0 border-border bg-card/90 shadow-none backdrop-blur-sm dark:bg-card/80 sm:rounded-xl sm:border sm:shadow-sm">
                <div className="platform-theme-content ed-mobile-content h-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-foreground sm:p-5 lg:p-6">
                  <DeveloperSensitiveBanner isSuperAdmin={isSuperAdmin} />
                  {children}
                </div>
              </div>
            </section>

            <footer className="ed-shell-panel hidden h-11 shrink-0 border-t px-6 lg:block">
              <div className="flex h-full items-center justify-between gap-4">
                <p className="truncate text-xs text-muted-foreground">
                  © {new Date().getFullYear()} EstateDesk{" "}
                  platform command centre
                  <span className="ml-2 hidden text-muted-foreground/80 lg:inline">
                    · One platform workspace
                  </span>
                </p>

                <nav
                  aria-label="Platform footer navigation"
                  className="flex shrink-0 items-center gap-2"
                >
                  <FooterLink href="/platform/organizations">Organizations</FooterLink>
                  <FooterLink href="/platform/system-health">System health</FooterLink>
                  <FooterLink href="/platform/security">Security</FooterLink>
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
  pendingProviderCount,
  pendingDemoCount = 0,
}: {
  children: ReactNode;
  fullName: string;
  isSuperAdmin: boolean;
  pendingProviderCount: number;
  pendingDemoCount?: number;
}) {
  return (
      <PlatformShellInner fullName={fullName} isSuperAdmin={isSuperAdmin} pendingProviderCount={pendingProviderCount} pendingDemoCount={pendingDemoCount}>
        {children}
      </PlatformShellInner>
  );
}
