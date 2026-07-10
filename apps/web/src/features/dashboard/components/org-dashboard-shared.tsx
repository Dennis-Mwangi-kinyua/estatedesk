import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  CircleAlert,
  Home,
  Users,
  Wallet,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export type IconType = ComponentType<{ className?: string }>;

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function MpesaLogo({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-emerald-600 text-white",
        className,
      )}
    >
      <span className="text-[11px] font-black tracking-[0.16em]">M-PESA</span>
    </div>
  );
}

export function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/88 dark:text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200",
  } as const;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </div>
  );
}

export function HeroAction({
  href,
  title,
  description,
  icon: Icon,
  dark = false,
}: {
  href: string;
  title: string;
  description: string;
  icon: IconType;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md",
        dark
          ? "border-neutral-900 bg-neutral-950 text-white dark:border-white/10 dark:bg-slate-800"
          : "border-neutral-200 bg-white text-neutral-950 dark:border-white/10 dark:bg-slate-900 dark:text-white",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            dark
              ? "bg-white/10 text-white"
              : "bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p
            className={cn(
              "mt-1.5 text-sm leading-6",
              dark ? "text-neutral-300" : "text-neutral-500 dark:text-neutral-300",
            )}
          >
            {description}
          </p>
        </div>
        <ArrowRight
          className={cn(
            "mt-1 h-4 w-4 shrink-0 transition group-hover:translate-x-0.5",
            dark ? "text-white/70" : "text-neutral-400 dark:text-neutral-400",
          )}
        />
      </div>
    </Link>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tint = "neutral",
  href,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: IconType;
  tint?: "blue" | "green" | "amber" | "red" | "neutral";
  href?: string;
}) {
  const tints = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200",
    neutral: "bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200",
  } as const;

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-300">{subtitle}</p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            tints[tint],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </>
  );

  const className =
    "group rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900/88 dark:hover:border-white/20";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}

export function ProgressCard({
  label,
  value,
  total,
  helper,
}: {
  label: string;
  value: number;
  total: number;
  helper: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-white/10 dark:bg-slate-800/70">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{label}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            {percentage}%
          </p>
        </div>
        <p className="max-w-[180px] text-right text-sm text-neutral-500 dark:text-neutral-300">{helper}</p>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-neutral-900 dark:bg-white"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function MiniStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 dark:border-white/10 dark:bg-slate-800/70">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">{helper}</p>
    </div>
  );
}

export function SnapshotRow({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: IconType;
  label: string;
  value: string | number;
  tone?: "neutral" | "red" | "amber" | "green";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200",
    red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  } as const;

  return (
    <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3.5 dark:bg-slate-800/70">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-neutral-700 dark:text-neutral-200">{label}</span>
      </div>
      <span className="text-sm font-semibold text-neutral-950 dark:text-white">{value}</span>
    </div>
  );
}

export function RingCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: number;
  sublabel: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const angle = safeValue * 3.6;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/88">
      <div className="flex items-center gap-4">
        <div
          className="relative h-24 w-24 shrink-0 rounded-full"
          style={{
            background: `conic-gradient(var(--foreground) ${angle}deg, color-mix(in oklch, var(--foreground) 14%, transparent) ${angle}deg)`,
          }}
        >
          <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-white dark:bg-slate-900">
            <span className="text-lg font-semibold text-neutral-950 dark:text-white">{safeValue}%</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">{label}</h3>
          <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-300">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}

export const DASHBOARD_QUICK_LINKS = [
  {
    href: "/dashboard/org",
    title: "Home",
    description: "Return to the organization command center.",
    icon: Home,
  },
  {
    href: "/dashboard/org/notifications",
    title: "Notifications",
    description: "Read alerts, reminders, and system activity.",
    icon: Bell,
  },
  {
    href: "/dashboard/org/units",
    title: "Units",
    description: "Manage vacancies, occupancy, and apartment status.",
    icon: Building2,
  },
  {
    href: "/dashboard/org/payments",
    title: "Payments",
    description: "Review M-Pesa, bank, and cash collections.",
    icon: Wallet,
  },
  {
    href: "/dashboard/org/tenants",
    title: "Tenants",
    description: "View active tenants, leases, and follow-up actions.",
    icon: Users,
  },
  {
    href: "/dashboard/org/issues",
    title: "Issues",
    description: "Handle urgent maintenance and repair follow-ups.",
    icon: CircleAlert,
  },
] as const;
