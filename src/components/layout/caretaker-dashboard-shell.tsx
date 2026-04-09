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
    <div className="h-dvh w-full overflow-hidden bg-neutral-100">
      <div className="flex h-full w-full overflow-hidden">
        <CaretakerDashboardSidebar fullName={fullName} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CaretakerDashboardHeader fullName={fullName} />

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>

          <CaretakerDashboardFooter />
        </div>
      </div>
    </div>
  );
}