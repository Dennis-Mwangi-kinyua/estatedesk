"use client";

import { Code2, Shield } from "lucide-react";
import { modeMeta, type PlatformMode } from "../_lib/nav";
import { usePlatformMode } from "./platform-mode-context";

type PlatformModeToggleProps = {
  variant?: "sidebar" | "header" | "mobile" | "compact";
  className?: string;
};

export function PlatformModeToggle({
  variant = "sidebar",
  className = "",
}: PlatformModeToggleProps) {
  const { mode, switchMode } = usePlatformMode();
  const compact = variant === "compact";
  const mobile = variant === "mobile";

  return (
    <div
      role="group"
      aria-label="Platform mode. Shortcut: Alt+Shift+A admin, Alt+Shift+D developer"
      title="Alt+Shift+A admin · Alt+Shift+D developer"
      className={[
        "grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/60 p-1",
        compact ? "min-w-[148px]" : "",
        mobile ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {(["admin", "developer"] as const).map((target) => {
        const active = mode === target;
        const Icon = target === "admin" ? Shield : Code2;
        const meta = modeMeta[target as PlatformMode];

        return (
          <button
            key={target}
            type="button"
            onClick={() => switchMode(target)}
            aria-pressed={active}
            className={[
              "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition",
              compact ? "min-h-9 px-2 py-1.5" : "",
              mobile ? "min-h-11 text-[13px]" : "",
              active
                ? target === "developer"
                  ? "bg-violet-600 text-white shadow-sm dark:bg-violet-500"
                  : "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-card hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{mobile ? meta.label : meta.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
