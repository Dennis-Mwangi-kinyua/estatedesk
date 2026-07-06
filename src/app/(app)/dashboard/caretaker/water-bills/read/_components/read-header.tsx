import Link from "next/link";
import { ArrowLeft, Droplets } from "lucide-react";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import type { CaretakerMeterReadPageData } from "../_lib/types";
import { QuickMeterReadingPopup } from "./quick-meter-reading-popup";

export function ReadHeader({
  data,
}: {
  data: Extract<CaretakerMeterReadPageData, { ok: true }>;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/dashboard/caretaker/water-bills"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to water bills
            </Link>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Droplets className="h-3.5 w-3.5" />
              Field operations
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Read water meters
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Select an apartment, enter previous and current meter readings,
              then submit to office for approval. Period{" "}
              <span className="font-medium text-foreground">{data.period}</span>.
            </p>

            <InAppGuideHint topic="water" workspace="caretaker" />
          </div>

          {data.quickEntryUnits.length > 0 ? (
            <QuickMeterReadingPopup
              period={data.period}
              pendingUnits={data.quickEntryUnits}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}