import Link from "next/link";
import { FileText, Users } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerLeasesPageData } from "../_lib/types";

export function LeasesHeader({
  data,
}: {
  data: Pick<CaretakerLeasesPageData, "totalLeases" | "activeLeases">;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Field operations
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Leases
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {data.activeLeases > 0
                ? `${data.activeLeases} active lease${data.activeLeases === 1 ? "" : "s"} across ${data.totalLeases} assigned record${data.totalLeases === 1 ? "" : "s"}.`
                : "Lease records connected to apartments and units assigned to you."}
            </p>

            <InAppGuideHint topic="caretaker" workspace="caretaker" />
          </div>

          <Link
            href="/dashboard/caretaker/tenants"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            <Users className="h-4 w-4" />
            Tenants
          </Link>
        </div>
      </div>
    </section>
  );
}