"use client";

import Link from "next/link";
import { ReactNode, useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  Database,
  FileChartColumn,
  Flag,
  Gauge,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout-action";

const iconMap = {
  Gauge,
  Activity,
  Search,
  Building2,
  Users,
  ShieldCheck,
  LockKeyhole,
  ShieldAlert,
  LifeBuoy,
  CreditCard,
  BriefcaseBusiness,
  KeyRound,
  ReceiptText,
  RefreshCcw,
  Flag,
  SlidersHorizontal,
  Bell,
  Settings,
  Database,
  FileChartColumn,
  Mail,
  BarChart3,
  UserCog,
};

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
};

export default function PlatformMobileShell({
  children,
  navItems,
  fullName,
}: {
  children: ReactNode;
  navItems: readonly NavItem[];
  fullName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-950">
                EstateDesk
              </h1>

              <p className="truncate text-xs text-slate-500">
                Platform administration
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls={panelId}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>

      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/35 transition-opacity duration-300 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id={panelId}
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 h-full w-[84%] max-w-[360px] border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-tight text-slate-950">
                Menu
              </h2>

              <p className="truncate text-xs text-slate-500">
                {fullName}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-auto p-3">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              const Icon = iconMap[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-md ${
                      active
                        ? "bg-white/12 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
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