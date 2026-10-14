"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Link from "@/components/navigation/workspace-link";
import { useNavigationDialog } from "@/components/navigation/use-navigation-dialog";
import { HeaderThemeToggle } from "@/components/theme/workspace-theme-toggle";
import { Building2, House, LogOut, ShieldCheck, UserRound } from "@/components/shared/colored-icons";
import { WorkspaceIdentity } from "@/components/shared/metric-sticker";
import { logoutAction } from "@/features/auth/actions/logout-action";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/profile", label: "My profile", icon: UserRound },
  { href: "/change-password", label: "Password & security", icon: ShieldCheck },
] as const;

function AccountNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Account navigation" className="space-y-1">
    {items.map(({ href, label, icon: Icon }) => {
      const active = pathname === href;
      return <Link
        key={href}
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${active ? "ed-nav-item-active" : "ed-nav-item"}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </Link>;
    })}
  </nav>;
}

function LogoutForm({ onClick }: { onClick?: () => void }) {
  return <form action={logoutAction}>
    <button
      type="submit"
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive transition hover:bg-destructive/5"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  </form>;
}

export function AccountProfileShell({
  children,
  fullName,
  roleLabel,
}: {
  children: ReactNode;
  fullName: string;
  roleLabel: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useNavigationDialog(mobileOpen, drawerRef, closeMobile);

  return <div data-workspace="account-profile" className="app-mobile-canvas ed-mobile-surface flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip">
    <aside className="ed-shell-panel fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r lg:flex">
      <div className="border-b border-border px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="ed-brand-mark flex h-10 w-10 items-center justify-center rounded-xl"><Building2 className="h-5 w-5" /></span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">EstateDesk</span>
            <span className="block text-xs text-muted-foreground">Your account</span>
          </span>
        </Link>
      </div>
      <div className="border-b border-border px-5 py-4">
        <p className="ed-full-name break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{fullName}</p>
        <p className="mt-1 text-xs text-muted-foreground">{roleLabel}</p>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <AccountNavigation />
      </div>
      <div className="border-t border-border p-3"><LogoutForm /></div>
    </aside>

    <header className="ed-shell-panel sticky top-0 z-[90] border-b shadow-sm lg:ml-72">
      <div className="flex min-h-16 items-center justify-between gap-3 px-3 pt-safe sm:px-6 lg:px-8 lg:pt-0">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open account navigation"
            aria-expanded={mobileOpen}
            className="ios-button ed-soft-button touch-target inline-flex shrink-0 items-center justify-center border lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Account</p>
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">Profile & settings</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <HeaderThemeToggle />
          <WorkspaceIdentity name={fullName} role={roleLabel} />
        </div>
      </div>
    </header>

    {mobileOpen ? <div className="fixed inset-0 z-[120] lg:hidden">
      <button type="button" aria-label="Close account navigation overlay" onClick={closeMobile} className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" />
      <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Account navigation" tabIndex={-1} className="ed-shell-panel absolute inset-y-0 left-0 flex w-[min(90vw,24rem)] flex-col border-r p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">EstateDesk account</p>
            <p className="ed-full-name mt-1 break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{fullName}</p>
          </div>
          <button type="button" onClick={closeMobile} aria-label="Close account navigation" className="ios-button ed-soft-button touch-target inline-flex shrink-0 items-center justify-center border">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4"><AccountNavigation onNavigate={closeMobile} /></div>
        <div className="border-t border-border pt-3"><LogoutForm onClick={closeMobile} /></div>
      </div>
    </div> : null}

    <div className="flex flex-1 flex-col lg:ml-72">
      <main className="app-content-shell mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="mt-auto border-t border-border bg-card/80 px-4 py-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="font-semibold text-foreground hover:underline">EstateDesk</Link>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/contact" className="hover:text-foreground hover:underline">Help & contact</Link>
            <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground hover:underline">Terms</Link>
          </nav>
          <p>© {new Date().getFullYear()} EstateDesk</p>
        </div>
      </footer>
    </div>
  </div>;
}
