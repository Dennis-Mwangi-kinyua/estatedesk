"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  Wrench,
  ClipboardList,
  FileText,
  Users,
  Droplets,
  Bell,
  LogOut,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout-action";

const navItems = [
  {
    href: "/dashboard/caretaker",
    label: "Overview",
    icon: Home,
    tone: "blue",
  },
  {
    href: "/dashboard/caretaker/issues",
    label: "My Issues",
    icon: Wrench,
    tone: "amber",
  },
  {
    href: "/dashboard/caretaker/inspections",
    label: "My Inspections",
    icon: ClipboardList,
    tone: "indigo",
  },
  {
    href: "/dashboard/caretaker/leases",
    label: "My Leases",
    icon: FileText,
    tone: "emerald",
  },
  {
    href: "/dashboard/caretaker/tenants",
    label: "My Tenants",
    icon: Users,
    tone: "violet",
  },
  {
    href: "/dashboard/caretaker/water-bills",
    label: "My Water Bills",
    icon: Droplets,
    tone: "sky",
  },
  {
    href: "/dashboard/caretaker/notifications",
    label: "Notifications",
    icon: Bell,
    tone: "rose",
  },
  {
    href: "/dashboard/caretaker/profile",
    label: "My Profile",
    icon: UserRound,
    tone: "blue",
  },
] as const;

type Props = {
  fullName: string;
};

const iconToneMap = {
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
  sky: "bg-sky-50 text-sky-700",
  rose: "bg-rose-50 text-rose-700",
} as const;

export function CaretakerDashboardSidebar({ fullName }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden xl:block xl:w-72 xl:shrink-0 2xl:w-80">
      <div className="sticky top-0 h-dvh border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col">
          <div className="shrink-0 border-b border-slate-200 px-5 py-5">
            <Link href="/dashboard/caretaker" className="block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                EstateDesk
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 2xl:text-xl">
                Caretaker Dashboard
              </h2>

              <p className="mt-1 text-sm text-slate-500">{fullName}</p>
            </Link>
          </div>

          <div className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 active:scale-[0.99]",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                    )}
                  >
                    <span
                      className={clsx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition",
                        active ? "bg-white/10 text-white" : iconToneMap[item.tone]
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>

                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="shrink-0 border-t border-slate-200 p-3">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
