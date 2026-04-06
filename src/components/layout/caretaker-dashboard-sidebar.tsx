"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard/caretaker", label: "Overview", emoji: "🏠" },
  { href: "/issues", label: "Issues", emoji: "🛠️" },
  { href: "/inspections", label: "Inspections", emoji: "📋" },
  { href: "/leases", label: "Leases", emoji: "📄" },
  { href: "/tenants", label: "Tenants", emoji: "🙂" },
  { href: "/water-bills", label: "Water Bills", emoji: "💧" },
];

type Props = {
  fullName: string;
};

export function CaretakerDashboardSidebar({ fullName }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden xl:block xl:w-72 xl:shrink-0 2xl:w-80">
      <div className="sticky top-0 h-dvh p-3 xl:p-4">
        <div className="flex h-full flex-col rounded-[28px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="shrink-0 border-b border-black/5 px-5 py-4">
            <Link href="/dashboard/caretaker" className="block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                EstateDesk
              </p>
              <h2 className="mt-1.5 text-lg font-bold tracking-tight text-neutral-900 2xl:text-xl">
                Caretaker Panel
              </h2>
              <p className="mt-1 text-xs text-neutral-500 2xl:text-sm">
                Daily property operations
              </p>
            </Link>

            <div className="mt-3 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-700 p-3.5 text-white">
              <p className="text-[11px] text-white/70">Signed in as</p>
              <p className="mt-1 truncate text-sm font-semibold">{fullName}</p>
              <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px]">
                <span>🧰</span>
                <span>Caretaker Workspace</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-3">
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                    )}
                  >
                    <span className="text-base leading-none">{item.emoji}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="shrink-0 border-t border-black/5 p-3">
            <div className="rounded-3xl bg-[#f5f5f7] p-3">
              <p className="text-sm font-semibold text-neutral-900">💡 Pro Tip</p>
              <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                Start with urgent issues, then inspections, then tenant follow-up.
              </p>
            </div>

            <Link
              href="/logout"
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <span>🚪</span>
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}