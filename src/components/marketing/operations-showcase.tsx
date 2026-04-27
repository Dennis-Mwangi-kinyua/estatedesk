import Link from "next/link";
import { type ElementType, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  Droplets,
  FileCheck2,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

type OperationsShowcaseProps = {
  standalone?: boolean;
  compact?: boolean;
};

type IconType = ElementType<{ className?: string }>;

type Plan = {
  name: string;
  price: string;
  note: string;
  points: readonly string[];
  featured?: boolean;
};

type SnapshotItem = {
  icon: IconType;
  label: string;
  value: string;
};

type ValueItem = {
  icon: IconType;
  eyebrow: string;
  title: string;
};

const PLANS: readonly Plan[] = [
  {
    name: "Free",
    price: "KES 0",
    note: "Start",
    points: ["Properties", "Tenants", "Access"],
  },
  {
    name: "Pro",
    price: "KES 4,500",
    note: "Popular",
    points: ["Rent", "Inspections", "Reports"],
    featured: true,
  },
  {
    name: "Plus",
    price: "KES 9,500",
    note: "Growth",
    points: ["Staff", "Controls", "Support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "Scale",
    points: ["Rollout", "Support", "Setup"],
  },
] as const;

const SNAPSHOT_ITEMS: readonly SnapshotItem[] = [
  { icon: Layers3, label: "Roles", value: "Access" },
  { icon: CreditCard, label: "Rent", value: "Billing" },
  { icon: Droplets, label: "Water", value: "Meters" },
  { icon: ClipboardList, label: "Inspections", value: "Status" },
] as const;

const VALUE_ITEMS: readonly ValueItem[] = [
  { icon: ShieldCheck, eyebrow: "Access", title: "Permissions" },
  { icon: FileCheck2, eyebrow: "Workflow", title: "Operations" },
  { icon: LockKeyhole, eyebrow: "Records", title: "Accountability" },
] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ShellCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-[26px] border border-white/10 bg-white/[0.045] shadow-[0_18px_60px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.025] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionBadge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-200/75">
      {children}
    </div>
  );
}

function SnapshotCard() {
  return (
    <ShellCard className="relative h-full overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-300/8 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[-0.01em] text-white">
            Workspace
          </p>
          <p className="mt-1 text-xs text-slate-300/55">Operations</p>
        </div>

        <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
          Active
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        {SNAPSHOT_ITEMS.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/8 bg-[#0b1422]/82 p-3 transition duration-200 hover:border-white/15 hover:bg-[#0d1828]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <Icon className="h-3.5 w-3.5 text-slate-100/85" />
            </div>
            <p className="mt-2.5 text-[13px] font-semibold text-white">
              {label}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300/48">{value}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-200/75">
          <LockKeyhole className="h-3.5 w-3.5 text-emerald-200" />
          Secure controls
        </div>
      </div>
    </ShellCard>
  );
}

function ValueGrid() {
  return (
    <div className="grid gap-2.5 lg:grid-cols-3">
      {VALUE_ITEMS.map(({ icon: Icon, eyebrow, title }) => (
        <ShellCard key={title} className="p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <Icon className="h-3.5 w-3.5 text-slate-100/80" />
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-100/65">
                {eyebrow}
              </p>
              <p className="mt-1 text-[14px] font-semibold tracking-[-0.02em] text-white">
                {title}
              </p>
            </div>
          </div>
        </ShellCard>
      ))}
    </div>
  );
}

function PlansSection() {
  return (
    <ShellCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <SectionBadge>
            <WalletCards className="h-3 w-3" />
            Pricing
          </SectionBadge>

          <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
            Plans
          </h2>
        </div>

        <Link
          href="/pricing"
          aria-label="View pricing plans"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-200/75 transition hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/60"
        >
          View
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={cx(
              "relative overflow-hidden rounded-[20px] border p-3 transition duration-200",
              plan.featured
                ? "border-emerald-200/30 bg-[linear-gradient(180deg,rgba(16,185,129,0.13),rgba(11,20,34,0.92))] shadow-[0_18px_50px_rgba(5,150,105,0.12)]"
                : "border-white/10 bg-[#0b1422]/88",
            )}
          >
            {plan.featured ? (
              <div className="absolute right-3 top-3 rounded-full border border-emerald-200/25 bg-emerald-300/10 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
                Popular
              </div>
            ) : null}

            <div className="min-h-[58px] pr-10">
              <h3 className="text-[14px] font-semibold text-white">{plan.name}</h3>
              <p className="mt-0.5 text-[10px] text-slate-300/48">{plan.note}</p>
              <p className="mt-2 text-[1.42rem] font-semibold tracking-[-0.04em] text-white">
                {plan.price}
              </p>
            </div>

            <ul className="mt-2.5 space-y-1.5 border-t border-white/10 pt-2.5">
              {plan.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2 text-[11px] leading-4 text-slate-200/68"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-300/12">
                    <Check className="h-2.5 w-2.5 text-emerald-200" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </ShellCard>
  );
}

export default function OperationsShowcase({
  standalone = false,
  compact = false,
}: OperationsShowcaseProps) {
  const currentYear = new Date().getFullYear();

  return (
    <section
      aria-labelledby="operations-showcase-title"
      className="relative h-[100dvh] w-full overflow-hidden bg-[#070d16] text-white"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(148,163,184,0.08),transparent_22%),linear-gradient(180deg,#08111d_0%,#070d16_52%,#050912_100%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:38px_38px]" />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="Go to EstateDesk home"
            className="inline-flex min-w-0 items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/60 sm:text-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="truncate">EstateDesk</span>
          </Link>

          {standalone ? (
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-semibold text-slate-200/78 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/60"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          ) : null}
        </header>

        <div className="mt-3 flex-1 overflow-hidden">
          <div className="grid h-full grid-rows-[auto_1fr_auto_auto] gap-2.5">
            <SectionBadge>
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Property operations software</span>
            </SectionBadge>

            <div className="grid min-h-0 gap-2.5 lg:grid-cols-[0.86fr_1.14fr]">
              <ShellCard
                className={cx(
                  "relative h-full overflow-hidden",
                  compact ? "p-3.5" : "p-4",
                )}
              >
                <div
                  className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-emerald-300/8 blur-3xl"
                  aria-hidden="true"
                />

                <div className="relative flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-300/45">
                  <span>EstateDesk</span>
                  <span className="text-white/20">•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-100/70">
                    <Sparkles className="h-3.5 w-3.5" />
                    Operations
                  </span>
                </div>

                <div className="relative mt-2.5 max-w-xl rounded-[22px] border border-white/10 bg-[#0b1422]/70 p-4">
                  <h1
                    id="operations-showcase-title"
                    className={cx(
                      "font-semibold tracking-[-0.045em] text-white",
                      compact
                        ? "text-[1.8rem] leading-[1.08] lg:text-[2rem]"
                        : "text-[1.85rem] leading-[1.06] lg:text-[2.15rem]",
                    )}
                  >
                    Clear property operations.
                  </h1>

                  <p className="mt-2.5 max-w-lg text-[13px] leading-5 text-slate-300/62">
                    Billing, tenants, inspections, teams, and records.
                  </p>
                </div>

                <div className="relative mt-3.5 flex flex-col gap-2.5 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/60"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-white/14 bg-white/[0.055] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/60"
                  >
                    Sign in
                  </Link>
                </div>
              </ShellCard>

              <SnapshotCard />
            </div>

            {!compact ? <ValueGrid /> : null}

            {!compact ? <PlansSection /> : null}
          </div>
        </div>

        <footer className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-300/35">
          <span>© {currentYear} EstateDesk.</span>
          <span className="hidden sm:inline-flex">Professional workspace</span>
        </footer>
      </div>
    </section>
  );
}
