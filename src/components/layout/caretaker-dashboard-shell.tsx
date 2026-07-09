import { ReactNode } from "react";
import { CaretakerDashboardSidebar } from "@/components/layout/caretaker-dashboard-sidebar";
import { CaretakerDashboardHeader } from "@/components/layout/caretaker-dashboard-header";
import { CaretakerDashboardFooter } from "@/components/layout/caretaker-dashboard-footer";

type CaretakerDashboardShellProps = {
  fullName: string;
  children: ReactNode;
};

export function CaretakerDashboardShell({
  fullName,
  children,
}: CaretakerDashboardShellProps) {
  return (
    <div className="app-mobile-canvas ed-mobile-surface h-dvh w-full min-w-0 overflow-hidden">
      <div className="flex h-full min-h-0 w-full">
        <CaretakerDashboardSidebar fullName={fullName} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <CaretakerDashboardHeader fullName={fullName} />

          <main className="mobile-bottom-safe min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-5 sm:py-5 md:px-6 lg:px-8">
            <div className="app-content-shell w-full min-w-0 space-y-4 sm:space-y-6">
              {children}
            </div>
          </main>

          <CaretakerDashboardFooter />
        </div>
      </div>
    </div>
  );
}
