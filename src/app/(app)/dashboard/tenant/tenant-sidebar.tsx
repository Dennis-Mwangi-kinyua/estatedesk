"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineHome,
  HiOutlineReceiptRefund,
  HiOutlineUser,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";

type TenantSidebarProps = {
  fullName: string;
};

export function TenantSidebar({ fullName }: TenantSidebarProps) {
  const pathname = usePathname();

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
    <aside className="hidden border-r border-neutral-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[290px] lg:flex-col">
      <div className="border-b border-neutral-200 px-6 py-6">
        <div className="rounded-[28px] bg-neutral-900 p-5 text-white shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
            Tenant Portal
          </p>
          <h2 className="mt-2 truncate text-lg font-semibold tracking-tight">
            {fullName}
          </h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
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
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <HiOutlineArrowLeftOnRectangle className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}