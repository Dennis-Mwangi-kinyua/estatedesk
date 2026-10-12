
import { PlatformSticker as VisualSticker } from "./platform-sticker";
import Link from "@/components/navigation/workspace-link";
import type { ComponentType, ReactNode } from "react";
import type { BarPoint } from "../_lib/types";
import { formatNumber } from "../_lib/helpers";

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="platform-glass-panel min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 lg:p-5">
      <div className="mb-5 flex items-start gap-3">
        <VisualSticker label={title} size="sm" className="shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950 dark:text-white">
            {subtitle}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  href,
  label,
  value,
  meta,
  metaTone,
}: {
  href?: string;
  label: string;
  value: string;
  meta: string;
  metaTone: string;
}) {
  const content = (
    <div className="platform-glass-metric group h-full min-w-0 relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20">
      <p className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
        <VisualSticker label={href ?? label} size="sm" className="shrink-0" />{label}
      </p>
      <div className="mt-4 flex flex-col items-start gap-2">
        <p className="break-words text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 tabular-nums dark:text-white lg:text-3xl">
          {value}
        </p>
        <p className={`text-xs leading-5 font-medium ${metaTone}`}>{meta}</p>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-primary">{content}</Link> : content;
}

export function CompactInfoCard({
  href,
  label,
  value,
  helper,
}: {
  href?: string;
  label: string;
  value: string;
  helper: string;
}) {
  const content = (
    <div className="platform-glass-metric group h-full min-w-0 relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20">
      <p className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
        <VisualSticker label={href ?? label} size="sm" className="shrink-0" />{label}
      </p>
      <div className="mt-4 flex flex-col items-start gap-2">
        <p className="break-words text-xl sm:text-2xl font-semibold tracking-tight text-slate-950 tabular-nums dark:text-white lg:text-3xl">
          {value}
        </p>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p>
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-primary">{content}</Link> : content;
}

export function ActionLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="platform-glass-action group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3.5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/25 dark:bg-slate-700 dark:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] dark:hover:border-white/40 dark:hover:bg-slate-600"
    >
      <VisualSticker label={label} size="sm" className="shrink-0" />
      <p className="min-w-0 text-sm font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-slate-50 dark:group-hover:text-white">
        {label}
      </p>
      <Icon aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="platform-glass-inset rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-slate-900">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

export function ChartPanel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="platform-glass-panel min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 lg:p-5">
      <div className="flex items-start gap-3">
        <VisualSticker label={title} size="sm" className="shrink-0" />
        <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      </div>
      <div className="mt-4 h-[240px]">{children}</div>
    </section>
  );
}

export function PremiumBarChart({
  bars,
  labels,
  values,
  valueFormatter,
  tone,
}: {
  bars: BarPoint[];
  labels: string[];
  values: number[];
  valueFormatter: (value: number) => string;
  tone: string;
}) {
  if (bars.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
        No analytics available.
      </div>
    );
  }

  return (
    <div className="platform-glass-chart flex h-full items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
      {bars.map((bar, index) => (
        <div key={bar.id} className="group flex h-full min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end justify-center">
            <div
              className={`platform-glass-bar w-full max-w-[48px] rounded-t-lg ${tone} shadow-sm transition-all duration-200 group-hover:-translate-y-1 dark:bg-white`}
              style={{ height: `${bar.height}%` }}
              title={`${labels[index]}: ${valueFormatter(values[index])}`}
            />
          </div>
          <div className="w-full text-center">
            <p className="truncate text-[10px] font-semibold text-slate-700 dark:text-slate-200">
              {labels[index]}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {valueFormatter(values[index])}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgressRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  const width = Math.max(6, Math.round((value / total) * 100));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span>{formatNumber(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function OrgPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center dark:border-white/10 dark:bg-slate-900">
      <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{formatNumber(value)}</p>
    </div>
  );
}

export function StatusBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: string;
}) {
  return (
    <span
      className={`platform-badge inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {children}
    </span>
  );
}
