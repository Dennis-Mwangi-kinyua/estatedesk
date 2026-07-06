"use client";

import { usePathname } from "next/navigation";
import { HoverPrefetchLink } from "@/components/navigation/app-links";
import { HiOutlineArrowLeftOnRectangle } from "react-icons/hi2";
import { tenantNavItems } from "./tenant-nav";
import { isTenantRouteActive } from "./tenant-route";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";

type TenantSidebarProps = {
  fullName: string;
  hasActiveLease: boolean;
};

export function TenantSidebar({ fullName, hasActiveLease }: TenantSidebarProps) {
  const pathname = usePathname();
  const navItems = tenantNavItems.filter(
    (item) => hasActiveLease || !item.requiresActiveLease,
  );

  return (
    <aside className="ed-shell-panel hidden border-r lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex lg:h-screen lg:w-[300px] lg:flex-col xl:w-[320px]">
      <div className="border-b border-neutral-200/70 px-4 py-4 xl:px-5 xl:py-5">
        <div className="ios-panel rounded-[26px] p-4">
          <div className="flex items-center gap-3">
            <div className="ed-brand-mark flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-sm">
              🏡
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Tenant Portal
              </p>
              <h2 className="truncate text-sm font-semibold tracking-tight text-foreground xl:text-[15px]">
                {fullName}
              </h2>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-center">
              <p className="text-[10px] font-semibold text-emerald-700">
                🔐 Secure
              </p>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-2 py-2 text-center">
              <p className="text-[10px] font-semibold text-sky-700">
                💳 Bills
              </p>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-50 px-2 py-2 text-center">
              <p className="text-[10px] font-semibold text-violet-700">
                📄 Lease
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-4 xl:px-4">
        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isTenantRouteActive(pathname, item.href);

            return (
              <HoverPrefetchLink
                key={item.href}
                href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.99] ${
                  isActive
                    ? "ed-nav-item-active"
                    : "ed-nav-item"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    isActive
                      ? "ed-nav-icon-active"
                      : "ed-nav-icon"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>

                <span className="min-w-0 truncate">{item.label}</span>

                {isActive ? (
                  <span className="ml-auto h-2 w-2 rounded-full bg-card/90" />
                ) : null}
              </HoverPrefetchLink>
            );
          })}
        </nav>

        <div className="mt-4 space-y-2 border-t border-neutral-200/70 pt-4">
          <InAppHelpNav workspace="tenant" compact />
          <form action={logoutAction}>
            <button
              type="submit"
              className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-100">
                <HiOutlineArrowLeftOnRectangle className="h-5 w-5" />
              </span>
              <span>Logout</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
