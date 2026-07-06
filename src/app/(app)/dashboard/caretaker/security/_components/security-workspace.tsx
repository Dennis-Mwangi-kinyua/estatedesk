import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { DevicesPanel } from "@/features/security/_components/devices-panel";
import type { CaretakerSecurityPageData } from "../_lib/types";
import { SecurityHeader } from "./security-header";
import { SecuritySidebar } from "./security-sidebar";
import { SecurityStats } from "./security-stats";

export function SecurityWorkspace({
  data,
}: {
  data: CaretakerSecurityPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <SecurityHeader data={data} />

      {data.ok ? (
        <>
          <SecurityStats data={data} />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <DevicesPanel sessions={data.sessions} />
            <SecuritySidebar />
          </div>
        </>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-5 sm:p-6">
            <ErrorStateCard message={data.errorMessage} />
          </div>
        </section>
      )}

      <CaretakerWorkspaceFooter note="Session management and account security for caretakers" />
    </div>
  );
}