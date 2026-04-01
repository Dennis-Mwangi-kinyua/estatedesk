"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  HiBars3,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineHome,
  HiOutlineReceiptRefund,
  HiOutlineUser,
  HiOutlineWrenchScrewdriver,
  HiXMark,
} from "react-icons/hi2";

type TenantHeaderProps = {
  fullName: string;
  activeOrgId: string;
};

export function TenantHeader({
  fullName,
  activeOrgId,
}: TenantHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard/tenant", icon: HiOutlineHome },
    { label: "Profile", href: "/dashboard/tenant/profile", icon: HiOutlineUser },
    { label: "Lease", href: "/dashboard/tenant/lease", icon: HiOutlineDocumentText },
    { label: "Payments", href: "/dashboard/tenant/payments", icon: HiOutlineCreditCard },
    { label: "Invoices", href: "/dashboard/tenant/invoice", icon: HiOutlineReceiptRefund },
    { label: "Maintenance", href: "/dashboard/tenant/maintenance", icon: HiOutlineWrenchScrewdriver },
    { label: "Documents", href: "/dashboard/tenant/documents", icon: HiOutlineFolder },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur-xl">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-800 shadow-sm transition active:scale-95 lg:hidden"
                aria-label="Open menu"
              >
                <HiBars3 className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                  Tenant Portal
                </p>
                <h1 className="truncate text-xl font-semibold tracking-tight text-neutral-900">
                  Dashboard
                </h1>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-right sm:block">
              <p className="max-w-[180px] truncate text-sm font-semibold text-neutral-900">
                {fullName}
              </p>
              <p className="text-xs text-neutral-500">Org: {activeOrgId}</p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:hidden">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {fullName}
            </p>
            <p className="mt-1 text-xs text-neutral-500">Org: {activeOrgId}</p>
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

          <div className="absolute inset-x-0 top-0 rounded-b-[32px] border-b border-neutral-200 bg-white shadow-2xl">
            <div className="px-4 pb-6 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                    Menu
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-900">
                    Tenant Portal
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-800 shadow-sm active:scale-95"
                  aria-label="Close menu"
                >
                  <HiXMark className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 rounded-3xl bg-neutral-50 p-4">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {fullName}
                </p>
                <p className="mt-1 text-xs text-neutral-500">Org: {activeOrgId}</p>
              </div>

              <nav className="mt-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-medium transition active:scale-[0.99] ${
                        isActive
                          ? "bg-neutral-900 text-white"
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
                  className="flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-medium text-red-600 transition hover:bg-red-50"
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