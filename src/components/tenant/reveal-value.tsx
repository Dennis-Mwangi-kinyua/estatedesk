"use client";

import { useState } from "react";

type RevealValueProps = {
  masked: string;
  value: string;
  emptyLabel?: string;
};

export function RevealValue({
  masked,
  value,
  emptyLabel = "—",
}: RevealValueProps) {
  const [revealed, setRevealed] = useState(false);

  const hasValue = Boolean(value && value.trim().length > 0);
  const displayValue = hasValue ? (revealed ? value : masked) : emptyLabel;

  return (
    <div className="mt-2 flex items-center justify-between gap-3">
      <p className="truncate text-sm font-semibold text-neutral-950">
        {displayValue}
      </p>

      {hasValue ? (
        <button
          type="button"
          onClick={() => setRevealed((prev) => !prev)}
          className="shrink-0 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.98]"
          aria-pressed={revealed}
        >
          {revealed ? "Hide" : "Reveal"}
        </button>
      ) : null}
    </div>
  );
}