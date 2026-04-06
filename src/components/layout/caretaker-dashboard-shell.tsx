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
    <div className="min-h-dvh w-full bg-[#f5f5f7]">
      <div className="flex min-h-dvh w-full">
        <CaretakerDashboardSidebar fullName={fullName} />

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <CaretakerDashboardHeader fullName={fullName} />

          <main className="flex-1 px-4 pt-4 pb-24 sm:px-5 md:px-6 lg:px-8">
            <div className="w-full xl:mx-auto xl:max-w-7xl">{children}</div>
          </main>

          <CaretakerDashboardFooter />
        </div>
      </div>
    </div>
  );
}