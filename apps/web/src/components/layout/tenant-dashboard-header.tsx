"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { HeaderThemeToggle } from "@/components/theme/theme-toggle";

type TenantDashboardHeaderProps = {
  organizationName: string;
  userName: string;
  unreadNotificationCount?: number;
  onMenuClick?: () => void;
};

export function TenantDashboardHeader({
  organizationName,
  userName,
  unreadNotificationCount = 0,
  onMenuClick,
}: TenantDashboardHeaderProps) {
  return (
    <header className="ed-shell-panel fixed left-0 right-0 top-0 z-[110] border-b bg-card/95 shadow-sm backdrop-blur-xl lg:left-72">
      <div className="flex h-[76px] items-center justify-between gap-3 px-3 pt-safe sm:px-6 lg:h-16 lg:px-8 lg:pt-0">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="ios-button ed-soft-button touch-target flex shrink-0 items-center justify-center border shadow-sm lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-950 dark:text-white sm:text-lg">
              {organizationName}
            </h1>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Tenant workspace
            </p>
          </div>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2">
          <HeaderThemeToggle />

          <Link
            href="/dashboard/tenant/notifications"
            aria-label={
              unreadNotificationCount > 0
                ? `Notifications, ${unreadNotificationCount} unread`
                : "Notifications"
            }
            className="ios-button ed-soft-button touch-target relative flex items-center justify-center border shadow-sm lg:h-10 lg:w-10"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            ) : null}
          </Link>

          <div className="ed-soft-button hidden max-w-[16rem] rounded-2xl border px-3 py-2 text-right shadow-sm backdrop-blur-xl sm:block">
            <p className="text-sm font-medium leading-none text-slate-950 dark:text-white">
              {userName}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Tenant account
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}