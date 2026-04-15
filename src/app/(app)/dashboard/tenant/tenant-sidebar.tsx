"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineArrowLeftOnRectangle } from "react-icons/hi2";
import { tenantNavItems } from "./tenant-nav";
import { isTenantRouteActive } from "./tenant-route";
import { logoutAction } from "@/app/(auth)/logout/actions";

type TenantSidebarProps = {
  fullName: string;
};

export function TenantSidebar({ fullName }: TenantSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-neutral-200/70 bg-gradient-to-b from-[#fcfcfd] to-[#f6f7fb] lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex lg:h-screen lg:w-[300px] lg:flex-col xl:w-[320px]">
      <div className="border-b border-neutral-200/70 px-4 py-4 xl:px-5 xl:py-5">
        <div className="rounded-[26px] border border-neutral-200/80 bg-white/95 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-lg text-white shadow-sm">
              🏡
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Tenant Portal
              </p>
              <h2 className="truncate text-sm font-semibold tracking-tight text-neutral-950 xl:text-[15px]">
                {fullName}
              </h2>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-center">
              <p className="text-[10px] font-semibold text-emerald-700">🔐 Secure</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-2 py-2 text-center">
              <p className="text-[10px] font-semibold text-sky-700">💳 Bills</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 px-2 py-2 text-center">
              <p className="text-[10px] font-semibold text-violet-700">📄 Lease</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-4 xl:px-4">
        <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {tenantNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isTenantRouteActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-neutral-950 text-white shadow-[0_10px_20px_rgba(15,23,42,0.14)]"
                    : "text-neutral-600 hover:bg-white hover:text-neutral-950 hover:shadow-sm"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-950 group-hover:text-white"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>

                <span className="min-w-0 truncate">{item.label}</span>

                {isActive ? (
                  <span className="ml-auto h-2 w-2 rounded-full bg-white/90" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 border-t border-neutral-200/80 pt-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <HiOutlineArrowLeftOnRectangle className="h-5 w-5 shrink-0" />
              </span>
              <span>Logout</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}