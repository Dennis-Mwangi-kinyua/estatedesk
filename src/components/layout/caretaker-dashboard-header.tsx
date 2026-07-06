"use client";

import { Bell, Menu } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { DeferredLink } from "@/components/navigation/app-links";
import { CaretakerMobileSidebar } from "@/components/layout/caretaker-mobile-nav";
import { HeaderThemeToggle } from "@/components/theme/theme-toggle";
import { CaretakerLocaleToggle } from "@/app/(app)/dashboard/caretaker/_components/caretaker-locale-toggle";
import { CaretakerSearchBar } from "@/app/(app)/dashboard/caretaker/_components/caretaker-search-bar";
import { OfflineQueuePanel } from "@/app/(app)/dashboard/caretaker/_components/offline-queue-panel";

type CaretakerDashboardHeaderProps = {
  fullName: string;
};

export function CaretakerDashboardHeader({
  fullName,
}: CaretakerDashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <>
      <header className="ed-shell-panel sticky top-0 z-40 shrink-0 border-b">
        <div className="flex h-auto min-h-[72px] flex-col gap-3 px-3 py-3 sm:min-h-[68px] sm:flex-row sm:items-center sm:justify-between sm:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={open}
              aria-controls="caretaker-mobile-drawer"
              className="ios-button ed-soft-button inline-flex h-11 w-11 shrink-0 items-center justify-center border shadow-sm xl:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-[11px]">
                  EstateDesk
                </p>
                <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
                <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                  Caretaker
                </span>
              </div>

              <h1 className="mt-0.5 truncate text-sm font-semibold text-foreground sm:text-base lg:text-lg">
                Welcome back, {fullName}
              </h1>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:max-w-xl">
            <CaretakerSearchBar className="hidden min-w-0 flex-1 sm:block" />
            <CaretakerLocaleToggle />
            <OfflineQueuePanel compact />
            <HeaderThemeToggle />

            <DeferredLink
              href="/dashboard/caretaker/notifications"
              aria-label="View notifications"
              className="ios-button ed-soft-button relative inline-flex h-11 w-11 shrink-0 items-center justify-center border shadow-sm"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
            </DeferredLink>
          </div>

          <CaretakerSearchBar className="w-full sm:hidden" />
        </div>
      </header>

      <CaretakerMobileSidebar
        fullName={fullName}
        open={open}
        onClose={closeMenu}
        returnFocusRef={menuButtonRef}
      />
    </>
  );
}