import { Building2 } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerUnitsPageData } from "../_lib/types";

export function UnitsHeader({
  data,
}: {
  data: Extract<CaretakerUnitsPageData, { ok: true }>;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          Assigned inventory
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Units
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          {data.totalUnits > 0
            ? `Browse ${data.totalUnits} apartment${data.totalUnits === 1 ? "" : "s"} in your caretaker scope. Open any unit for tenant, billing, and issue context.`
            : "No units are currently assigned to your caretaker scope."}
        </p>

        <InAppGuideHint topic="caretaker" workspace="caretaker" />
      </div>
    </section>
  );
}