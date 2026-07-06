"use client";

import { usePathname } from "next/navigation";
import { HoverPrefetchLink } from "@/components/navigation/app-links";
import clsx from "clsx";
import {
  Home,
  Wrench,
  ClipboardList,
  FileText,
  Users,
  Droplets,
  Inbox,
  Bell,
  LogOut,
  ShieldCheck,
  UserRound,
  ListTodo,
  Building2,
  Search,
  Calendar,
  DoorOpen,
  FolderOpen,
  Megaphone,
  NotebookPen,
  Truck,
} from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";
import { CARETAKER_NAV_ITEMS } from "@/app/(app)/dashboard/caretaker/_lib/i18n";
import { CaretakerNavLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-nav-label";

const navIcons = {
  "/dashboard/caretaker/today": ListTodo,
  "/dashboard/caretaker/search": Search,
  "/dashboard/caretaker/calendar": Calendar,
  "/dashboard/caretaker": Home,
  "/dashboard/caretaker/units": Building2,
  "/dashboard/caretaker/issues": Wrench,
  "/dashboard/caretaker/inspections": ClipboardList,
  "/dashboard/caretaker/move-outs": DoorOpen,
  "/dashboard/caretaker/leases": FileText,
  "/dashboard/caretaker/tenants": Users,
  "/dashboard/caretaker/water-bills": Droplets,
  "/dashboard/caretaker/documents": FolderOpen,
  "/dashboard/caretaker/broadcasts": Megaphone,
  "/dashboard/caretaker/handover": NotebookPen,
  "/dashboard/caretaker/vendors": Truck,
  "/dashboard/caretaker/finance-requests": Inbox,
  "/dashboard/caretaker/notifications": Bell,
  "/dashboard/caretaker/profile": UserRound,
  "/dashboard/caretaker/security": ShieldCheck,
} as const;

type Props = {
  fullName: string;
};

export function CaretakerDashboardSidebar({ fullName }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden xl:block xl:w-72 xl:shrink-0 2xl:w-80">
      <div className="ed-shell-panel sticky top-0 h-dvh border-r">
        <div className="flex h-full flex-col">
          <div className="shrink-0 border-b border-border px-5 py-5">
            <HoverPrefetchLink href="/dashboard/caretaker" className="block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                EstateDesk
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground 2xl:text-xl">
                Caretaker Dashboard
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">{fullName}</p>
            </HoverPrefetchLink>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1">
              {CARETAKER_NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                const Icon = navIcons[item.href as keyof typeof navIcons] ?? Home;

                return (
                  <HoverPrefetchLink
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 active:scale-[0.99]",
                      active ? "ed-nav-item-active" : "ed-nav-item",
                    )}
                  >
                    <span
                      className={clsx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition",
                        active ? "ed-nav-icon-active" : "ed-nav-icon",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>

                    <span className="truncate">
                      <CaretakerNavLabel labelKey={item.labelKey} />
                    </span>
                  </HoverPrefetchLink>
                );
              })}
            </nav>
          </div>

          <div className="shrink-0 space-y-2 border-t border-border p-3">
            <InAppHelpNav workspace="caretaker" compact />
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