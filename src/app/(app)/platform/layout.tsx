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
  { href: "/platform/support-access", label: "Support Access", icon: "LifeBuoy" },
  { href: "/platform/billing", label: "Billing", icon: "CreditCard" },
  { href: "/platform/subscriptions", label: "Subscriptions", icon: "BriefcaseBusiness" },
  { href: "/platform/api-keys", label: "API Keys", icon: "KeyRound" },
  { href: "/platform/payments", label: "Payments", icon: "ReceiptText" },
  { href: "/platform/payment-ops", label: "Payment Ops", icon: "RefreshCcw" },
  { href: "/platform/feature-flags", label: "Feature Flags", icon: "Flag" },
  { href: "/platform/onboarding", label: "Onboarding", icon: "SlidersHorizontal" },
  { href: "/platform/marketing", label: "Marketing", icon: "BriefcaseBusiness" },
  { href: "/platform/broadcasts", label: "Broadcasts", icon: "Bell" },
  { href: "/platform/jobs", label: "Jobs", icon: "Settings" },
  { href: "/platform/data-management", label: "Data", icon: "Database" },
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
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="flex h-full">
        <aside className="hidden h-full w-[280px] shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight text-slate-950">
                  EstateDesk
                </h1>
                <p className="text-xs text-slate-500">Platform administration</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors group-hover:bg-white group-hover:text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                Signed in as
              </p>
              <p className="mt-1 truncate text-sm font-medium text-slate-900">
                {session.fullName}
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </aside>

        <PlatformMobileShell navItems={navItems} fullName={session.fullName}>
          <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
            <header className="hidden shrink-0 border-b border-slate-200 bg-white px-6 py-4 lg:block">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950">
                    Platform Admin
                  </h2>
                  <p className="truncate text-sm text-slate-500">
                    Manage organizations, platform users, billing, audit logs, and reports
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                  <MessageSquareText className="h-4 w-4 text-slate-500" />
                  <span className="max-w-[180px] truncate text-sm font-medium text-slate-700">
                    {session.fullName}
                  </span>
                </div>
              </div>
            </header>

            <section className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
              <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="h-full overflow-auto p-4 sm:p-5 lg:p-6">
                  {children}
                </div>
              </div>
            </section>
          </main>
        </PlatformMobileShell>
      </div>
    </div>
  );
}
