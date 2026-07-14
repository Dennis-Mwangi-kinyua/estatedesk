import type { ReactNode } from "react";

/**
 * Mobile-first data presentation:
 * - default: stacked cards/list (phones + small tablets)
 * - lg+: wide table for dense comparison
 */
export function ResponsiveDataList({
  mobile,
  desktop,
  className,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
  className?: string;
}) {
  return (
    <div className={["min-w-0 max-w-full", className].filter(Boolean).join(" ")}>
      <div className="min-w-0 lg:hidden">{mobile}</div>
      <div className="hidden min-w-0 overflow-x-auto lg:block">{desktop}</div>
    </div>
  );
}

export function DataCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={[
        "min-w-0 border-b border-border px-3 py-3.5 last:border-b-0 sm:px-4 sm:py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </article>
  );
}

export function DataCardRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 text-xs sm:text-sm">
      <dt className="shrink-0 font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
