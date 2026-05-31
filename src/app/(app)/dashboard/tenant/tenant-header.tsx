"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  HiBars3,
  HiOutlineArrowLeftOnRectangle,
  HiXMark,
} from "react-icons/hi2";
import { tenantNavItems } from "./tenant-nav";
import { isTenantRouteActive } from "./tenant-route";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { HeaderThemeToggle } from "@/components/theme/theme-toggle";

type TenantHeaderProps = {
  fullName: string;
  orgName: string;
  hasActiveLease: boolean;
};

export function TenantHeader({
  fullName,
  orgName,
  hasActiveLease,
}: TenantHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = useMemo(
    () =>
      tenantNavItems.filter(
        (item) => hasActiveLease || !item.requiresActiveLease,
      ),
    [hasActiveLease],
  );

  const activeItem = useMemo(() => {
    return (
      navItems.find((item) => isTenantRouteActive(pathname, item.href)) ??
      navItems[0]
    );
  }, [navItems, pathname]);

  return (
    <>
      <header className="ed-shell-panel fixed left-0 right-0 top-0 z-30 border-b lg:left-[300px] xl:left-[320px]">
        <div className="px-3 py-3 sm:px-6 lg:px-8 lg:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="ios-button ed-soft-button inline-flex h-11 w-11 items-center justify-center border shadow-sm lg:hidden"
                aria-label="Open menu"
              >
                <HiBars3 className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Tenant Portal
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg">{activeItem.emoji}</span>
                  <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-950">
                    {activeItem.label}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <HeaderThemeToggle className="lg:hidden" />

              <div className="ed-soft-button hidden rounded-[22px] border px-4 py-3 text-right shadow-sm sm:block">
              <p className="max-w-[200px] truncate text-sm font-semibold text-neutral-950">
                {fullName}
              </p>
              <p className="text-xs text-neutral-500">{orgName}</p>
              </div>
            </div>
          </div>

          <div className="ios-card mt-3 rounded-[22px] p-3 sm:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-neutral-50 text-base ring-1 ring-neutral-200">
                👋
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {fullName}
                </p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {orgName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-neutral-950/35 backdrop-blur-md"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu overlay"
          />

          <div className="ed-shell-panel absolute inset-x-3 top-4 mx-auto max-h-[calc(100vh-2rem)] max-w-[430px] overflow-y-auto rounded-[32px] border shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:inset-x-6">
            <div className="px-4 pb-5 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                    Menu
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-950">
                    Tenant Portal
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="ios-button ed-soft-button inline-flex h-11 w-11 items-center justify-center border shadow-sm"
                  aria-label="Close menu"
                >
                  <HiXMark className="h-5 w-5" />
                </button>
              </div>

              <div className="ios-card mt-4 rounded-[24px] p-4">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {fullName}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{orgName}</p>
              </div>

              <nav className="mt-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isTenantRouteActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-[22px] px-4 py-4 text-sm font-medium transition active:scale-[0.99] ${
                        isActive
                          ? "ed-nav-item-active"
                          : "ed-nav-item"
                      }`}
                    >
                      <span className="text-base">{item.emoji}</span>
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          isActive
                            ? "ed-nav-icon-active"
                            : "ed-nav-icon"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <form action={logoutAction} onSubmit={() => setMenuOpen(false)}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-[22px] px-4 py-4 text-sm font-medium text-red-600 transition hover:bg-red-50 active:scale-[0.99]"
                  >
                    <span className="text-base">👋</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <HiOutlineArrowLeftOnRectangle className="h-5 w-5 shrink-0" />
                    </span>
                    <span>Logout</span>
                  </button>
                </form>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
