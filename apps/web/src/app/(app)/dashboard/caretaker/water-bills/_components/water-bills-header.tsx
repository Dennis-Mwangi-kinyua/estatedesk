import Link from "next/link";
import { Droplets } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { CURRENT_PERIOD } from "../_lib/types";
import type { CaretakerWaterBillsData } from "../_lib/types";
import { StatusBadge } from "./water-bills-ui";

export function WaterBillsHeader({
  data,
}: {
  data: Pick<CaretakerWaterBillsData, "pendingUnits">;
}) {
  const pendingCount = data.pendingUnits.length;

  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Droplets className="h-3.5 w-3.5" />
              Water billing workflow
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Water bills
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Record previous and current meter units, submit readings to the
              office for approval, then track approved readings through tenant
              billing for {CURRENT_PERIOD}.
            </p>

            <div className="mt-4">
              <StatusBadge
                label={`${pendingCount} apartment${pendingCount === 1 ? "" : "s"} still need submission`}
                tone="red"
                pulse={pendingCount > 0}
              />
            </div>

            <InAppGuideHint topic="water" workspace="caretaker" />
          </div>

          <Link
            href="/dashboard/caretaker/water-bills/read"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Droplets className="h-4 w-4" />
            Read water bills
          </Link>
        </div>
      </div>
    </section>
  );
}