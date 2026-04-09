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
    <header className="fixed left-0 right-0 top-0 z-[90] border-b border-black/10 bg-white/95 backdrop-blur-md lg:left-72">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-900 shadow-sm transition active:scale-[0.96] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-neutral-950 sm:text-lg">
              {title}
            </h1>
            <p className="truncate text-xs text-neutral-500 sm:text-sm">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-900 shadow-sm transition hover:bg-neutral-50"
          >
            <Bell className="h-4 w-4" />
          </Link>

          <div className="hidden rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm sm:block">
            <p className="text-sm font-medium leading-none text-neutral-950">
              {userName}
            </p>
            <p className="mt-1 text-[11px] text-neutral-500">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}