"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineArrowLeftOnRectangle } from "react-icons/hi2";
import { tenantNavItems } from "./tenant-nav";

type TenantSidebarProps = {
  fullName: string;
};

export function TenantSidebar({ fullName }: TenantSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-neutral-200/80 bg-white/95 backdrop-blur lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex lg:h-screen lg:w-[290px] lg:flex-col">
      <div className="border-b border-neutral-200/80 px-5 py-5">
        <div className="rounded-[30px] border border-neutral-200/80 bg-neutral-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-white text-xl shadow-sm ring-1 ring-neutral-200">
              🏡
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                Tenant Portal
              </p>
              <h2 className="truncate text-base font-semibold tracking-tight text-neutral-950">
                {fullName}
              </h2>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              ✨ Secure
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
              💳 Payments
            </span>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
              📄 Lease
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-4">
        <nav className="space-y-2">
          {tenantNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200 pt-4">
          <Link
            href="/logout"
            className="flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <HiOutlineArrowLeftOnRectangle className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}