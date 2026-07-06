"use client";

import { memo } from "react";
import { Building2, LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { HoverPrefetchLink } from "@/components/navigation/app-links";
import { isActivePath, type SidebarLink } from "./org-sidebar-links";

type SidebarNavItemProps = {
  item: SidebarLink;
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
};

export const SidebarNavItem = memo(function SidebarNavItem({
  item,
  pathname,
  mobile = false,
  onNavigate,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const active = isActivePath(pathname, item.href);

  if (mobile) {
    return (
      <HoverPrefetchLink
        href={item.href}
        onClick={onNavigate}
        className={[
          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors duration-150",
          active ? "ed-nav-item-active" : "ed-nav-item",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            active
              ? "ed-nav-icon-active"
              : "ed-nav-icon",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate">{item.label}</span>
          <Icon
            className={
            active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-current opacity-45"
            }
          />
        </div>
      </HoverPrefetchLink>
    );
  }

  return (
    <HoverPrefetchLink
      href={item.href}
      className={[
        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
        active ? "ed-nav-item-active" : "ed-nav-item",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 items-center justify-center rounded-md",
          active
          ? "ed-nav-icon-active"
          : "ed-nav-icon",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="truncate">{item.label}</span>
        <Icon className={active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-current opacity-45"} />
      </div>
    </HoverPrefetchLink>
  );
});

export const SidebarBrand = memo(function SidebarBrand({
  organizationName,
}: {
  organizationName: string;
}) {
  return (
    <HoverPrefetchLink href="/dashboard/org" className="flex items-center gap-3">
      <div className="ed-brand-mark flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
        <Building2 className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
          {organizationName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Organization workspace</p>
      </div>
    </HoverPrefetchLink>
  );
});

export const LogoutButton = memo(function LogoutButton({
  mobile = false,
  onClick,
}: {
  mobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <form action={logoutAction} onSubmit={onClick}>
      <button
        type="submit"
        className={[
          "flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-colors",
          mobile
            ? "px-4 py-3.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10"
            : "px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10",
        ].join(" ")}
      >
        <span
          className={[
            "flex items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
            mobile ? "h-9 w-9 shrink-0" : "h-9 w-9",
          ].join(" ")}
        >
          <LogOut className="h-4 w-4" />
        </span>

        <span className="truncate">Logout</span>
      </button>
    </form>
  );
});