"use client";

import Link from "next/link";
import { WorkspaceIdentity } from "@/components/shared/metric-sticker";
import { BellRing as Bell, Menu } from "lucide-react";
import { HeaderThemeToggle } from "@/components/theme/workspace-theme-toggle";

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
    <header className="ed-shell-panel sticky top-0 z-[110] border-b bg-card/95 shadow-sm backdrop-blur-xl lg:ml-72">
      <div className="flex min-h-[76px] items-center justify-between gap-3 px-3 pt-safe sm:px-6 lg:min-h-16 lg:px-8 lg:pt-0">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button data-workspace-action="true"
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="ios-button ed-soft-button touch-target flex shrink-0 items-center justify-center border shadow-sm lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 py-2">
            <h1 className="hidden ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-base lg:block font-semibold tracking-tight text-slate-950 dark:text-white sm:text-lg">
              {organizationName}
            </h1>
            <p className="hidden text-xs lg:block text-slate-500 dark:text-slate-400 sm:text-sm">
              Tenant workspace
            </p>
            <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-white lg:hidden">Tenant</p>
          </div>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2">
          <HeaderThemeToggle />

          <Link data-workspace-action="true"
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

          <WorkspaceIdentity name={userName} role="Tenant account" />
        </div>
      </div>
      <div className="border-t border-slate-200/70 bg-slate-50/90 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <h1 className="ed-full-name whitespace-normal break-words text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100 [overflow-wrap:anywhere]">{organizationName}</h1>
      </div>
    </header>
  );
}