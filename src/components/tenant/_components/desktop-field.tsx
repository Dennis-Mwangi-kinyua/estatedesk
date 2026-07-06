"use client";

import { memo, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

export const DesktopField = memo(function DesktopField({
  label,
  value,
  onReveal,
  isSensitive = false,
  revealed = false,
}: {
  label: string;
  value: ReactNode;
  onReveal?: () => void;
  isSensitive?: boolean;
  revealed?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>

        {isSensitive && onReveal ? (
          <button
            type="button"
            onClick={onReveal}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-foreground/80 ring-1 ring-neutral-200 transition hover:bg-neutral-50"
          >
            {revealed ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Reveal
              </>
            )}
          </button>
        ) : null}
      </div>

      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
});