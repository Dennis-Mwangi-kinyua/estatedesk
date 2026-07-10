import Link from "next/link";
import { ClipboardList, Home } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerInspectionsPageData } from "../_lib/queries";

type InspectionsHeaderProps = {
  stats: CaretakerInspectionsPageData["stats"];
};

export function InspectionsHeader({ stats }: InspectionsHeaderProps) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5" />
              Field operations
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Inspections
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {stats.scheduled > 0
                ? `${stats.scheduled} inspection${stats.scheduled === 1 ? "" : "s"} scheduled across your assigned properties.`
                : "View inspections for apartments, buildings, and properties allocated to you."}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              <InAppGuideHint topic="caretaker" workspace="caretaker" />
              <InAppGuideLink topic="moveOut" workspace="caretaker" />
            </div>
          </div>

          <Link
            href="/dashboard/caretaker"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
          This page is allocation-based. You can only access inspections tied to
          your assigned properties and units.
        </div>
      </div>
    </section>
  );
}