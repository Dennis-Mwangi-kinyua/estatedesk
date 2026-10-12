import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import Link from "@/components/navigation/workspace-link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { ShieldCheck } from "@/components/shared/colored-icons";
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
    <section data-workspace-header className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <VisualSticker label="Import files" size="xs" />
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
            <Link data-workspace-action="true"
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/40"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>

<div className="grid min-w-0 gap-3 px-4 py-4 min-[420px]:grid-cols-2 lg:grid-cols-3 sm:px-6">
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

      <details className="border-t border-border">
        <summary className="flex min-h-12 cursor-pointer items-center gap-3 px-4 text-sm font-semibold text-foreground sm:px-6"><VisualSticker label="Help" size="xs" />How importing works</summary>
      <div className="grid gap-3 border-t border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        {IMPORT_WORKFLOW_STEPS.map((item) => (
          <div
            key={item.step}
            className="workspace-metric min-w-0 rounded-2xl border border-border bg-muted/20 p-4"
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
      </details>
      <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-6">Overview reflects the latest 12 import runs.</p>
    </section>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="workspace-metric min-w-0 rounded-2xl border border-border bg-muted/20 p-4">
      <p className="flex items-center gap-2 text-xs font-medium leading-5 text-muted-foreground">
        <VisualSticker label={label} size="xs" />{label}
      </p>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}