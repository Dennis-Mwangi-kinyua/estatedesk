"use client";

import Link from "next/link";
import { WorkspaceIdentity } from "@/components/shared/metric-sticker";
import { Bell, Menu, Search } from "lucide-react";
import { HeaderThemeToggle } from "@/components/theme/workspace-theme-toggle";

type OrgDashboardHeaderProps = {
  title?: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  unreadCount?: number;
  onMenuClick?: () => void;
};

export function OrgDashboardHeader({
  title = "Organization Dashboard",
  subtitle = "Manage operations, staff, payments, and reports.",
  userName = "Admin User",
  userRole = "Organization Admin",
  onMenuClick,
  unreadCount = 0,
}: OrgDashboardHeaderProps) {
  return (
    <header className="ed-shell-panel fixed left-0 right-0 top-0 z-[110] border-b bg-card/95 shadow-sm backdrop-blur-xl lg:left-72">
      <div className="flex h-[68px] items-center justify-between gap-3 px-3 pt-safe sm:px-6 lg:h-16 lg:px-8 lg:pt-0">
        <div className="flex min-w-0 items-center gap-3">
          <button data-workspace-action="true"
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="ios-button ed-soft-button touch-target flex shrink-0 items-center justify-center border shadow-sm lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="hidden truncate text-base font-semibold tracking-tight text-slate-950 dark:text-white lg:block lg:text-lg">
              {title}
            </h1>
            <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 lg:block lg:text-sm">
              {subtitle}
            </p>
            <p className="text-sm font-semibold tracking-tight text-slate-950 dark:text-white lg:hidden">
              Organisation
            </p>
          </div>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2">
          <Link data-workspace-action="true" href="/dashboard/org/search" aria-label="Search organisation" className="ios-button ed-soft-button touch-target flex items-center justify-center border"><Search className="h-4 w-4" /></Link>
          <HeaderThemeToggle />

          <Link data-workspace-action="true"
            href="/dashboard/org/notifications"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            className="relative ios-button ed-soft-button touch-target flex items-center justify-center border shadow-sm lg:h-10 lg:w-10"
          >
            <Bell className="h-4 w-4" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </Link>

          <WorkspaceIdentity name={userName} role={userRole} />
        </div>
      </div>
      <div className="border-t border-slate-200/70 bg-slate-50/90 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <p className="whitespace-normal break-words text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100 [overflow-wrap:anywhere]">
          {title}
        </p>
      </div>
    </header>
  );
}
