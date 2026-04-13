import Link from "next/link";
import { memo } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  Droplets,
  Layers3,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

type OperationsShowcaseProps = {
  standalone?: boolean;
  compact?: boolean;
};

const PLANS = [
  {
    name: "Free",
    price: "KES 0",
    note: "Start small",
    points: ["Properties", "Tenants", "Basic access"],
    featured: false,
  },
  {
    name: "Pro",
    price: "KES 4,500",
    note: "Most popular",
    points: ["Rent & water billing", "Inspections", "Reports"],
    featured: true,
  },
  {
    name: "Plus",
    price: "KES 9,500",
    note: "Growing portfolios",
    points: ["Staff workflows", "Advanced controls", "Priority support"],
    featured: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "Large organizations",
    points: ["Custom rollout", "Dedicated support", "Enterprise setup"],
    featured: false,
  },
] as const;

const SNAPSHOT_ITEMS = [
  { icon: Layers3, label: "Role routing", value: "Smart access" },
  { icon: CreditCard, label: "Rent billing", value: "Automated cycles" },
  { icon: Droplets, label: "Water billing", value: "Meter-ready" },
  { icon: ClipboardList, label: "Inspections", value: "Track and verify" },
] as const;

const VALUE_ITEMS = [
  {
    eyebrow: "Access",
    title: "Structured permissions",
    body: "Support for administrators, managers, accountants, caretakers, office teams, and tenants.",
  },
  {
    eyebrow: "Workflow",
    title: "Operational control",
    body: "Coordinate occupancy, leasing, billing, inspections, support, and reporting from one place.",
  },
  {
    eyebrow: "Governance",
    title: "Clear accountability",
    body: "Keep dependable records, controlled actions, and full visibility across your daily operations.",
  },
] as const;

function ShellCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

const SnapshotCard = memo(function SnapshotCard() {
  return (
    <ShellCard className="p-4 sm:p-5 h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[-0.01em] text-white">
            Workspace snapshot
          </p>
          <p className="mt-1 text-xs text-white/55">
            Built for clean daily operations
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Active
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {SNAPSHOT_ITEMS.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/8 bg-[#0a1528]/80 p-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Icon className="h-3.5 w-3.5 text-white/80" />
            </div>
            <p className="mt-2.5 text-[13px] font-medium leading-5 text-white">{label}</p>
            <p className="mt-0.5 text-[11px] text-white/50">{value}</p>
          </div>
        ))}
      </div>
    </ShellCard>
  );
});

const ValueGrid = memo(function ValueGrid() {
  return (
    <div className="grid gap-2.5 lg:grid-cols-3">
      {VALUE_ITEMS.map((item) => (
        <ShellCard key={item.title} className="p-3.5 sm:p-4">
          <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-sky-200/75">
            {item.eyebrow}
          </p>
          <p className="mt-2 text-[15px] font-semibold tracking-[-0.02em] text-white">
            {item.title}</p>
          <p className="mt-1.5 text-[12px] leading-5 text-white/62">{item.body}</p>
        </ShellCard>
      ))}
    </div>
  );
});

const PlansSection = memo(function PlansSection() {
  return (
    <ShellCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-white/72">
            <WalletCards className="h-3 w-3" />
            Pricing
          </div>

          <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white sm:text-xl">
            Straightforward plans for every stage
          </h2>
        </div>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-xs font-medium text-white/78 transition hover:text-white"
        >
          View pricing
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative overflow-hidden rounded-[20px] border p-3.5 ${
              plan.featured
                ? "border-sky-300/30 bg-[linear-gradient(180deg,rgba(56,189,248,0.16),rgba(14,22,38,0.9))] shadow-[0_18px_50px_rgba(14,165,233,0.12)]"
                : "border-white/10 bg-[#0b1628]/88"
            }`}
          >
            {plan.featured ? (
              <div className="absolute right-3 top-3 rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                Popular
              </div>
            ) : null}

            <div className="min-h-[64px] pr-10">
              <p className="text-[15px] font-semibold text-white">{plan.name}</p>
              <p className="mt-0.5 text-[10px] text-white/50">{plan.note}</p>
              <p className="mt-2.5 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
                {plan.price}
              </p>
            </div>

            <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
              {plan.points.map((point) => (
                <div key={point} className="flex items-start gap-2 text-[12px] leading-4 text-white/72">
                  <div className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-400/12">
                    <Check className="h-3 w-3 text-emerald-300" />
                  </div>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ShellCard>
  );
});

export default function OperationsShowcase({
  standalone = false,
  compact = false,
}: OperationsShowcaseProps) {
  return (
    <section
      className={[
        "relative h-screen w-full overflow-hidden bg-[#07111f] text-white",
        standalone ? "min-h-screen" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_18%),linear-gradient(180deg,#091223_0%,#07111f_48%,#050d18_100%)]" />
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:30px_30px] sm:[background-size:38px_38px]" />
      </div>

      <div className="relative z-10 mx-auto flex h-screen w-full max-w-7xl flex-col px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/92 sm:text-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="truncate">EstateDesk</span>
          </Link>

          {standalone ? (
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 sm:px-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          ) : null}
        </div>

        <div className="mt-3 flex-1 overflow-hidden">
          <div className="grid h-full grid-rows-[auto_1fr_auto_auto] gap-2.5 lg:gap-3">
            <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/8 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-sky-100/85 sm:px-4 sm:text-[10px]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Trusted software for property operations</span>
            </div>

            <div className="grid min-h-0 gap-2.5 lg:grid-cols-[0.84fr_1.16fr] lg:gap-3">
              <ShellCard className={`${compact ? "p-3.5 lg:p-4" : "p-4 sm:p-4.5 lg:p-4.5"} h-full`}>
                <div className="flex flex-wrap items-center gap-2 text-[9px] font-medium uppercase tracking-[0.18em] text-white/45">
                  <span>EstateDesk platform</span>
                  <span className="text-white/20">•</span>
                  <span className="inline-flex items-center gap-1 text-sky-200/80">
                    <Sparkles className="h-3.5 w-3.5" />
                    Modern operations
                  </span>
                </div>

                <div className="mt-2.5 max-w-lg rounded-[22px] border border-white/10 bg-[#0b1628]/70 p-3.5 sm:p-4">
                  <h1
                    className={`font-semibold tracking-[-0.035em] text-white ${
                      compact
                        ? "text-[1.8rem] leading-[1.1] sm:text-[1.95rem] lg:text-[2rem]"
                        : "text-[1.8rem] leading-[1.08] sm:text-[1.95rem] lg:text-[2rem]"
                    }`}
                  >
                    Property management, designed to feel clear, structured, and professional.
                  </h1>

                  <p className="mt-2.5 text-[13px] leading-5 text-white/64 sm:text-[14px]">
                    Manage rent collection, water billing, inspections, tenant records, staff coordination, and reporting from one polished operational workspace.
                  </p>
                </div>

                <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-white/90"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
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

        <div className="mt-2 text-center text-[10px] text-white/35 sm:text-left">
          © {new Date().getFullYear()} EstateDesk. All rights reserved.
        </div>
      </div>
    </section>
  );
}
