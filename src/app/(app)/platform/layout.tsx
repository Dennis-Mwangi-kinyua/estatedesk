import Link from "next/link";
import { ReactNode } from "react";
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
  MessageSquareText,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
} from "lucide-react";
import { HeaderThemeToggle } from "@/components/theme/theme-toggle";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { logoutAction } from "@/features/auth/actions/logout-action";
import PlatformMobileShell from "./platform-mobile-shell";

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

const navItems = [
  { href: "/platform", label: "Dashboard", icon: "Gauge" },
  { href: "/platform/system-health", label: "System Health", icon: "Activity" },
  { href: "/platform/search", label: "Global Search", icon: "Search" },
  { href: "/platform/organizations", label: "Organizations", icon: "Building2" },
  { href: "/platform/users", label: "Platform Users", icon: "Users" },
  { href: "/platform/admins", label: "Platform Admins", icon: "ShieldCheck" },
  { href: "/platform/permissions", label: "Permissions", icon: "LockKeyhole" },
  { href: "/platform/security", label: "Security", icon: "ShieldAlert" },
  { href: "/platform/rate-limits", label: "Rate Limits", icon: "ShieldAlert" },
  { href: "/platform/support-access", label: "Support Access", icon: "LifeBuoy" },
  { href: "/platform/billing", label: "Billing", icon: "CreditCard" },
  { href: "/platform/subscriptions", label: "Subscriptions", icon: "BriefcaseBusiness" },
  { href: "/platform/api-keys", label: "API Keys", icon: "KeyRound" },
  { href: "/platform/payments", label: "Payments", icon: "ReceiptText" },
  { href: "/platform/expenditures", label: "Expenditures", icon: "ReceiptText" },
  { href: "/platform/payment-ops", label: "Payment Ops", icon: "RefreshCcw" },
  { href: "/platform/feature-flags", label: "Feature Flags", icon: "Flag" },
  { href: "/platform/onboarding", label: "Onboarding", icon: "SlidersHorizontal" },
  { href: "/platform/marketing", label: "Marketing", icon: "BriefcaseBusiness" },
  { href: "/platform/broadcasts", label: "Broadcasts", icon: "Bell" },
  { href: "/platform/jobs", label: "Jobs", icon: "Settings" },
  { href: "/platform/data-management", label: "Data", icon: "Database" },
  { href: "/platform/backups", label: "Backups", icon: "Database" },
  { href: "/platform/audit-logs", label: "Audit Logs", icon: "FileChartColumn" },
  { href: "/platform/messages", label: "Messages", icon: "Mail" },
  { href: "/platform/reports", label: "Reports", icon: "BarChart3" },
  { href: "/platform/settings", label: "Settings", icon: "UserCog" },
] as const;

export type PlatformNavItem = (typeof navItems)[number];

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  return (
    <div className="h-dvh overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-dvh overflow-hidden">
        <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[280px] border-r border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 lg:flex lg:flex-col">
          <div className="shrink-0 border-b border-slate-200 px-5 py-5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                  EstateDesk
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Platform administration</p>
              </div>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors group-hover:bg-white group-hover:text-primary dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-slate-800 dark:group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-slate-200 p-4 dark:border-white/10">
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Signed in as
              </p>
              <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                {session.fullName}
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </aside>

        <PlatformMobileShell navItems={navItems} fullName={session.fullName}>
          <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden lg:pl-[280px]">
            <header className="hidden h-[76px] shrink-0 border-b border-slate-200 bg-white px-6 dark:border-white/10 dark:bg-slate-950 lg:block">
              <div className="flex h-full items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Platform Admin
                  </h2>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    Manage organizations, platform users, billing, audit logs, and reports
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <HeaderThemeToggle />
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <MessageSquareText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span className="max-w-[220px] truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {session.fullName}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <section className="min-h-0 flex-1 overflow-hidden p-2 sm:p-4 lg:p-6">
              <div className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:rounded-xl">
                <div className="platform-theme-content h-full overflow-auto p-4 text-slate-950 dark:text-slate-100 sm:p-5 lg:p-6">
                  {children}
                </div>
              </div>
            </section>

            <footer className="hidden h-11 shrink-0 border-t border-slate-200 bg-white px-6 dark:border-white/10 dark:bg-slate-950 lg:block">
              <div className="flex h-full items-center justify-between gap-4">
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  © {new Date().getFullYear()} EstateDesk platform control plane
                </p>

                <nav aria-label="Platform footer navigation" className="flex shrink-0 items-center gap-2">
                  <Link
                    href="/platform/audit-logs"
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    Audit Logs
                  </Link>
                  <Link
                    href="/platform/security"
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    Security
                  </Link>
                  <Link
                    href="/platform/settings"
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    Settings
                  </Link>
                </nav>
              </div>
            </footer>
          </main>
        </PlatformMobileShell>
      </div>
    </div>
  );
}
