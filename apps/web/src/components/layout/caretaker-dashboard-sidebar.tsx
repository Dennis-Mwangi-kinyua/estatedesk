"use client";

import { SidebarSticker } from "@/components/shared/sidebar-sticker";

import { usePathname } from "next/navigation";
import { HoverPrefetchLink } from "@/components/navigation/app-links";
import clsx from "clsx";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";
import { CARETAKER_NAV_ITEMS } from "@/app/(app)/dashboard/caretaker/_lib/i18n";
import { CaretakerNavLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-nav-label";

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
                  pathname === item.href || (item.href !== "/dashboard/caretaker" && pathname.startsWith(`${item.href}/`));


                return (
                  <HoverPrefetchLink
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
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
                      <SidebarSticker href={item.href} />
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