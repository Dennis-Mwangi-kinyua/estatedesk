"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard/caretaker", label: "Overview", emoji: "🏠" },
  { href: "/issues", label: "Issues", emoji: "🛠️" },
  { href: "/inspections", label: "Inspections", emoji: "📋" },
  { href: "/leases", label: "Leases", emoji: "📄" },
  { href: "/tenants", label: "Tenants", emoji: "🙂" },
  { href: "/water-bills", label: "Water Bills", emoji: "💧" },
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
        className={clsx(
          "absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        aria-label="Close menu overlay"
      />

      <aside
        className={clsx(
          "absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-hidden rounded-r-[32px] border-r border-black/5 bg-[#f5f5f7] shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-black/5 bg-white/80 px-5 py-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                EstateDesk
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">
                Caretaker Panel
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{fullName}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-neutral-800" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-4 rounded-[28px] bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-400">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              Mobile caretaker dashboard
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
                📱 iOS style
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
                🧰 Field ready
              </span>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium shadow-sm transition",
                    active
                      ? "border border-neutral-900 bg-neutral-900 text-white"
                      : "border border-black/5 text-neutral-700"
                  )}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-black/5 bg-white px-4 pb-8 pt-4">
          <Link
            href="/logout"
            className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <span>🚪</span>
            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}