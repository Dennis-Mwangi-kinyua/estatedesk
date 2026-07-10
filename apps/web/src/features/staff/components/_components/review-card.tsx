"use client";

import { memo } from "react";

export const ReviewCard = memo(function ReviewCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-neutral-950">
        {value}
      </p>
    </div>
  );
});