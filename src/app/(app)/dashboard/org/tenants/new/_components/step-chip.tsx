"use client";

import type { StepItem } from "../_lib/types";

export function StepChip({
  item,
  active,
  complete,
}: {
  item: StepItem;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={`w-[220px] shrink-0 rounded-2xl border px-4 py-4 sm:w-auto ${
        active
          ? "border-primary bg-card shadow-sm"
          : complete
            ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30"
            : "border-border bg-muted/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
            active
              ? "bg-primary text-primary-foreground"
              : complete
                ? "bg-emerald-600 text-white dark:bg-emerald-500"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {complete ? "✓" : item.id}
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
      </div>
    </div>
  );
}