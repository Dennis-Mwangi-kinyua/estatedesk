"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";

type OrgDashboardHeaderProps = {
  title?: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  onMenuClick?: () => void;
};

export function OrgDashboardHeader({
  title = "Organization Dashboard",
  subtitle = "Manage operations, staff, payments, and reports.",
  userName = "Admin User",
  userRole = "Organization Admin",
  onMenuClick,
}: OrgDashboardHeaderProps) {
  return (
    <header className="ed-shell-panel fixed left-0 right-0 top-0 z-[90] border-b lg:left-72">
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
              {title}
            </h1>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/org/notifications"
            aria-label="Notifications"
            className="ios-button ed-soft-button touch-target flex items-center justify-center border shadow-sm lg:h-10 lg:w-10"
          >
            <Bell className="h-4 w-4" />
          </Link>

          <div className="ed-soft-button hidden max-w-[16rem] rounded-2xl border px-3 py-2 text-right shadow-sm backdrop-blur-xl sm:block">
            <p className="text-sm font-medium leading-none text-slate-950 dark:text-white">
              {userName}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
