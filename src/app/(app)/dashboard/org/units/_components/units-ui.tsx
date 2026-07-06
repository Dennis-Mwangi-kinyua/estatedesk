import type { ReactNode } from "react";
import { DeferredLink } from "@/components/navigation/app-links";

export * from "../_lib/helpers";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export const fieldClassName =
  "h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20";

export const buttonPrimaryClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90";

export const buttonSecondaryClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30";

export function StatCard({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: string | number;
  note?: string;
  highlight?: "default" | "warning" | "success";
}) {
  const valueClassName =
    highlight === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : highlight === "success"
        ? "text-emerald-700 dark:text-emerald-200"
        : "text-foreground";

  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${valueClassName}`}>{value}</p>
      {note ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

export function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function FilterPill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        : tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200"
          : "border-border bg-muted/20 text-foreground";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${toneClassName}`}
    >
      {children}
    </span>
  );
}

export function InlineMixStats({
  totalUnits,
  occupiedUnits,
  vacantUnits,
}: {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
}) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      <span className="whitespace-nowrap">
        <strong className="font-semibold text-foreground">{totalUnits}</strong> units
      </span>
      <span aria-hidden className="text-border">
        ·
      </span>
      <span className="whitespace-nowrap">
        <strong
          className={`font-semibold ${
            occupiedUnits > 0
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-foreground"
          }`}
        >
          {occupiedUnits}
        </strong>{" "}
        occupied
      </span>
      <span aria-hidden className="text-border">
        ·
      </span>
      <span className="whitespace-nowrap">
        <strong
          className={`font-semibold ${
            vacantUnits > 0
              ? "text-amber-700 dark:text-amber-300"
              : "text-foreground"
          }`}
        >
          {vacantUnits}
        </strong>{" "}
        vacant
      </span>
    </p>
  );
}

const mixActionToneClassName = {
  success:
    "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60",
  warning:
    "border-amber-200/80 bg-amber-50/80 text-amber-800 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60",
} as const;

export function MixActionLink({
  href,
  label,
  count,
  tone,
}: {
  href: string;
  label: string;
  count: number;
  tone: "success" | "warning";
}) {
  return (
    <DeferredLink
      href={href}
      className={`inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-xs font-semibold transition ${mixActionToneClassName[tone]}`}
    >
      <span>{label}</span>
      <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[11px] font-bold tabular-nums">
        {count}
      </span>
    </DeferredLink>
  );
}