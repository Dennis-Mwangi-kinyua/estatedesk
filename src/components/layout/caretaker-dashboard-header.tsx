"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { useCallback, useState } from "react";
import { CaretakerMobileSidebar } from "@/components/layout/caretaker-mobile-nav";

type CaretakerDashboardHeaderProps = {
  fullName: string;
};

export function CaretakerDashboardHeader({
  fullName,
}: CaretakerDashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-40 shrink-0 border-b border-white/60 bg-white/78 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
        <div className="flex h-[72px] items-center justify-between gap-3 px-3 sm:h-[68px] sm:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
              className="ios-button inline-flex h-11 w-11 shrink-0 items-center justify-center border border-neutral-200 bg-white/88 text-neutral-700 shadow-sm hover:bg-white xl:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500 sm:text-[11px]">
                  EstateDesk
                </p>
                <span className="hidden h-1 w-1 rounded-full bg-neutral-300 sm:inline-block" />
                <span className="hidden text-xs font-medium text-neutral-500 sm:inline">
                  Caretaker
                </span>
              </div>

              <h1 className="mt-0.5 truncate text-sm font-semibold text-neutral-900 sm:text-base lg:text-lg">
                Welcome back, {fullName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/caretaker/notifications"
              aria-label="View notifications"
              className="ios-button relative inline-flex h-11 w-11 shrink-0 items-center justify-center border border-neutral-200 bg-white/88 text-neutral-700 shadow-sm hover:bg-white"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-neutral-900" />
            </Link>
          </div>
        </div>
      </header>

      <CaretakerMobileSidebar
        fullName={fullName}
        open={open}
        onClose={closeMenu}
      />
    </>
  );
}
