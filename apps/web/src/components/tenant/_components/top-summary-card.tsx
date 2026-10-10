"use client";

import { memo, type ReactNode } from "react";

export const TopSummaryCard = memo(function TopSummaryCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
});