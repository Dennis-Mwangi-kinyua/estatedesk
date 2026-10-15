"use client";

import { CaretakerNavigation } from "./caretaker-navigation";

import { HoverPrefetchLink } from "@/components/navigation/app-links";
import { LogOut } from "@/components/shared/colored-icons";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";

export function CaretakerDashboardSidebar() {

  return (
    <aside className="hidden xl:block xl:w-72 xl:shrink-0 2xl:w-80">
      <div className="ed-shell-panel sticky top-0 h-dvh border-r">
        <div className="flex h-full flex-col">
          <div className="shrink-0 border-b border-border px-5 py-5">
            <HoverPrefetchLink href="/dashboard/caretaker/today" className="block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                EstateDesk
              </p>

              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground 2xl:text-xl">
                Field operations
              </h2>
            </HoverPrefetchLink>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <CaretakerNavigation />
          </div>

          <div className="shrink-0 space-y-2 border-t border-border p-3">
            <InAppHelpNav workspace="caretaker" compact />
            <form data-logout-form action={logoutAction}>
              <button data-action-kind="destructive" data-workspace-action="true"
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
