"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  HiBars3,
  HiOutlineArrowLeftOnRectangle,
  HiXMark,
} from "react-icons/hi2";
import { tenantNavItems } from "./tenant-nav";

type TenantHeaderProps = {
  fullName: string;
  orgName: string;
};

export function TenantHeader({ fullName, orgName }: TenantHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeItem =
    tenantNavItems.find(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`)
    ) ?? tenantNavItems[0];

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl lg:left-[290px]">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-neutral-200 bg-white text-neutral-800 shadow-sm transition active:scale-95 lg:hidden"
                aria-label="Open menu"
              >
                <HiBars3 className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Tenant Portal
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-950">
                    {activeItem.label}
                  </h1>
                </div>
              </div>
            </div>

            <div className="hidden rounded-[22px] border border-neutral-200 bg-white/90 px-4 py-3 text-right shadow-sm sm:block">
              <p className="max-w-[200px] truncate text-sm font-semibold text-neutral-950">
                {fullName}
              </p>
              <p className="text-xs text-neutral-500">{orgName}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-neutral-200 bg-white/90 p-4 shadow-sm sm:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-neutral-50 text-lg ring-1 ring-neutral-200">
                👋
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {fullName}
                </p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">{orgName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu overlay"
          />

          <div className="absolute inset-x-0 top-0 max-h-[100vh] overflow-y-auto rounded-b-[32px] border-b border-neutral-200 bg-white shadow-2xl">
            <div className="px-4 pb-6 pt-4">
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-neutral-200 bg-white text-neutral-800 shadow-sm active:scale-95"
                  aria-label="Close menu"
                >
                  <HiXMark className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {fullName}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{orgName}</p>
              </div>

              <nav className="mt-4 space-y-2">
                {tenantNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-[22px] px-4 py-4 text-sm font-medium transition active:scale-[0.99] ${
                        isActive
                          ? "bg-neutral-950 text-white"
                          : "bg-white text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <Link
                  href="/logout"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-[22px] px-4 py-4 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <HiOutlineArrowLeftOnRectangle className="h-5 w-5 shrink-0" />
                  <span>Logout</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}