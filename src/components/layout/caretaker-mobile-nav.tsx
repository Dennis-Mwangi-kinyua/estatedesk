"use client";

import Link from "next/link";
import {
  X,
  Home,
  Wrench,
  ClipboardList,
  FileText,
  Users,
  Droplets,
  LogOut,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard/caretaker", label: "Overview", icon: Home },
  { href: "/dashboard/caretaker/issues", label: "Issues", icon: Wrench },
  { href: "/dashboard/caretaker/inspections", label: "Inspections", icon: ClipboardList },
  { href: "/dashboard/caretaker/leases", label: "Leases", icon: FileText },
  { href: "/dashboard/caretaker/tenants", label: "Tenants", icon: Users },
  { href: "/dashboard/caretaker/water-bills", label: "Water Bills", icon: Droplets },
];

type Props = {
  fullName: string;
  open: boolean;
  onClose: () => void;
};

export function CaretakerMobileSidebar({
  fullName,
  open,
  onClose,
}: Props) {
  const pathname = usePathname();
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    onClose();
  }, [pathname, onClose]);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 xl:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu overlay"
        className={clsx(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <aside
        className={clsx(
          "absolute left-0 top-0 flex h-full w-[86%] max-w-xs flex-col border-r border-neutral-200/80 bg-white/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/90 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="shrink-0 border-b border-neutral-200/80 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  EstateDesk
                </p>
                <span className="h-1 w-1 rounded-full bg-neutral-300" />
                <span className="text-xs font-medium text-neutral-500">
                  Caretaker
                </span>
              </div>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">
                Navigation
              </h2>

              <p className="mt-1 truncate text-sm text-neutral-500">
                {fullName}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-[0.98]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
            <p className="text-xs font-medium text-neutral-500">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              Caretaker dashboard
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Access issues, inspections, tenants, leases, and billing in one
              organized workspace.
            </p>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    active
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-700 hover:bg-neutral-100"
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
                      active
                        ? "bg-white/10 text-white"
                        : "bg-neutral-100 text-neutral-600 group-hover:bg-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-neutral-200/80 px-3 py-4">
          <Link
            href="/logout"
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}