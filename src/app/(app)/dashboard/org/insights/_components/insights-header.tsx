import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, BadgeCheck, Lightbulb } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { INSIGHTS_WORKFLOW_STEPS } from "../_lib/constants";
import type { InsightsPageData } from "../_lib/types";
import { panelShellClassName } from "./insights-ui";

export function InsightsHeader({
  data,
  orgRole,
}: {
  data: InsightsPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5" />
              Smart operations
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Insights and recommendations
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Ranked operational actions from live portfolio, ledger, payment, lease,
              maintenance, and water data for {data.period} at{" "}
              {data.organizationName}.
            </p>

            <InAppGuideHint topic="rent" workspace="org" orgRole={orgRole} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <Link
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <div className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-muted/15 px-4 text-xs font-medium text-muted-foreground">
              <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Live operational signals
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {INSIGHTS_WORKFLOW_STEPS.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-border bg-muted/15 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {item.step}
              </span>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}