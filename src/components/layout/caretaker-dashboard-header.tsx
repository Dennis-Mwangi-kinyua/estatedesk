"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { CaretakerMobileSidebar } from "@/components/layout/caretaker-mobile-nav";

type CaretakerDashboardHeaderProps = {
  fullName: string;
};

export function CaretakerDashboardHeader({
  fullName,
}: CaretakerDashboardHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 shrink-0 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="flex min-h-16 items-center justify-between px-4 sm:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition hover:bg-neutral-50 xl:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-neutral-800" />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                EstateDesk
              </p>
              <h1 className="truncate text-base font-semibold text-neutral-900 sm:text-lg">
                Welcome, {fullName}
              </h1>
            </div>
          </div>

          <Link
            href="/notifications"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg shadow-sm transition hover:bg-neutral-50"
            aria-label="Notifications"
          >
            🔔
          </Link>
        </div>
      </header>

      <CaretakerMobileSidebar
        fullName={fullName}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}