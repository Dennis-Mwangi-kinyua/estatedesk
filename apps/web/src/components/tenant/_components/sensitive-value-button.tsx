"use client";

import { memo } from "react";
import { EyeOff, LockKeyhole } from "lucide-react";
import { getVisibleValue } from "../_lib/helpers";
import type { SensitiveFieldKey } from "../_lib/types";
import { MobileEmoji } from "./ios-primitives";

export const SensitiveValueButton = memo(function SensitiveValueButton({
  label,
  value,
  fieldKey,
  revealed,
  onRequestReveal,
  emoji,
}: {
  label: string;
  value?: string | null;
  fieldKey: SensitiveFieldKey;
  revealed: boolean;
  onRequestReveal: (field: SensitiveFieldKey) => void;
  emoji?: string;
}) {
  const shownValue = getVisibleValue(revealed, fieldKey, value);

  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      {emoji ? (
        <div className="shrink-0 lg:hidden">
          <MobileEmoji symbol={emoji} />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-foreground">{label}</p>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="max-w-[180px] truncate text-right text-[15px] font-medium text-muted-foreground sm:max-w-none">
          {shownValue}
        </div>

        <button
          type="button"
          onClick={() => onRequestReveal(fieldKey)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-neutral-100 hover:text-neutral-800"
          aria-label={revealed ? `Hide ${label}` : `Reveal ${label}`}
        >
          {revealed ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
});