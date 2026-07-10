import type { ReactNode } from "react";
import { scoreBarColor } from "../_lib/helpers";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export function StatCard({
  label,
  value,
  note,
  highlight,
  icon,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  highlight?: "default" | "warning" | "success";
  icon?: ReactNode;
}) {
  const valueClassName =
    highlight === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : highlight === "success"
        ? "text-emerald-700 dark:text-emerald-200"
        : "text-foreground";

  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <div className={`mt-2 text-2xl font-semibold ${valueClassName}`}>{value}</div>
          {note ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/20 text-muted-foreground">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
      <div
        className={`h-full rounded-full ${scoreBarColor(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}