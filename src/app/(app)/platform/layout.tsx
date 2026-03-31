import Link from "next/link";
import { ReactNode } from "react";
import { requirePlatformRole } from "@/lib/permissions/guards";
import PlatformMobileShell from "./platform-mobile-shell";

const navItems = [
  { href: "/platform", label: "Dashboard", emoji: "📊" },
  { href: "/platform/organizations", label: "Organizations", emoji: "🏢" },
  { href: "/platform/users", label: "Platform Users", emoji: "👥" },
  { href: "/platform/admins", label: "Platform Admins", emoji: "🛡️" },
  { href: "/platform/billing", label: "Billing", emoji: "💳" },
  { href: "/platform/audit-logs", label: "Audit Logs", emoji: "📜" },
  { href: "/platform/reports", label: "Reports", emoji: "📈" },
] as const;

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  return (
    <div className="h-screen overflow-hidden bg-neutral-100 text-neutral-900">
      <div className="flex h-full">
        <aside className="hidden h-full w-[280px] shrink-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-neutral-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-lg">
                🏠
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight">
                  EstateDesk
                </h1>
                <p className="text-sm text-neutral-500">Platform Administration</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-auto p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-base">
                  {item.emoji}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-neutral-200 p-4">
            <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">
                Signed in as
              </p>
              <p className="mt-1 truncate text-sm font-medium text-neutral-900">
                {session.fullName}
              </p>
            </div>

            <form action="/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </form>
          </div>
        </aside>

        <PlatformMobileShell navItems={navItems} fullName={session.fullName}>
          <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
            <header className="hidden shrink-0 border-b border-neutral-200 bg-white px-6 py-4 lg:block">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-neutral-950">
                    Platform Admin
                  </h2>
                  <p className="truncate text-sm text-neutral-500">
                    Manage organizations, platform users, billing, audit logs, and reports
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2">
                  <span className="text-sm">👤</span>
                  <span className="max-w-[180px] truncate text-sm font-medium text-neutral-700">
                    {session.fullName}
                  </span>
                </div>
              </div>
            </header>

            <section className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
              <div className="h-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="h-full overflow-auto p-4 sm:p-5 lg:p-6">{children}</div>
              </div>
            </section>
          </main>
        </PlatformMobileShell>
      </div>
    </div>
  );
}