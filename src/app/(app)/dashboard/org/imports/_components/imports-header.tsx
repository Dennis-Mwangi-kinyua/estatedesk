import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { IMPORT_WORKFLOW_STEPS } from "../_lib/constants";
import type { ImportHistoryItem } from "../_lib/types";
import { panelShellClassName } from "./imports-ui";

export function ImportsHeader({
  history,
  historyUnavailable,
  orgRole,
}: {
  history: ImportHistoryItem[];
  historyUnavailable: boolean;
  orgRole?: OrgRole | null;
}) {
  const completedRuns = history.filter((run) => run.status === "COMPLETED").length;
  const failedRuns = history.filter((run) => run.status === "FAILED").length;
  const totalCreated = history.reduce((sum, run) => sum + run.createdRows, 0);

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Data onboarding
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Import portfolio records
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Bring properties, units, and tenants into EstateDesk from CSV. Validate
              first to catch formatting issues, then commit when the preview is clean.
            </p>

            <InAppGuideHint topic="portfolio" workspace="org" orgRole={orgRole} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/40"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        <HeaderStat
          label="Completed runs"
          value={historyUnavailable ? "—" : String(completedRuns)}
        />
        <HeaderStat
          label="Records created"
          value={historyUnavailable ? "—" : String(totalCreated)}
        />
        <HeaderStat
          label="Failed attempts"
          value={historyUnavailable ? "—" : String(failedRuns)}
        />
      </div>

      <div className="grid gap-3 border-t border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        {IMPORT_WORKFLOW_STEPS.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-border bg-muted/20 p-4"
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

      <div className="flex items-start gap-3 border-t border-border bg-muted/15 px-5 py-4 sm:px-6">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm leading-6 text-muted-foreground">
          Imports are capped at <span className="font-medium text-foreground">500 rows</span>{" "}
          per run and committed in a single database transaction. If validation fails or the
          commit errors, no partial records are saved.
        </p>
      </div>
    </section>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}