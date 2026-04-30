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
  UsersRound,
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

type OperationCard = {
  icon: IconType;
  title: string;
  label: string;
  description: string;
  accent: string;
  iconClassName: string;
};

type SnapshotItem = {
  icon: IconType;
  label: string;
  value: string;
  iconClassName: string;
};

type ControlItem = {
  icon: IconType;
  title: string;
  detail: string;
  iconClassName: string;
};

const PLANS: readonly Plan[] = [
  {
    name: "Free",
    price: "KES 0",
    note: "Start",
    points: ["Properties", "Tenants"],
  },
  {
    name: "Pro",
    price: "KES 4,500",
    note: "Popular",
    points: ["Rent", "Reports"],
    featured: true,
  },
  {
    name: "Plus",
    price: "KES 9,500",
    note: "Growth",
    points: ["Staff", "Controls"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "Scale",
    points: ["Rollout", "Support"],
  },
] as const;

const OPERATIONS: readonly OperationCard[] = [
  {
    icon: CreditCard,
    title: "Rent collection",
    label: "Billing",
    description: "Track invoices, balances, and payment follow-up across every property.",
    accent: "border-l-emerald-500",
    iconClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  {
    icon: ClipboardList,
    title: "Inspections",
    label: "Field work",
    description: "Record checks, issues, and action items from routine property visits.",
    accent: "border-l-sky-500",
    iconClassName: "border-sky-100 bg-sky-50 text-sky-700",
  },
  {
    icon: UsersRound,
    title: "Tenant records",
    label: "People",
    description: "Keep occupancy, contacts, and tenant history clean and searchable.",
    accent: "border-l-indigo-500",
    iconClassName: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
  {
    icon: ShieldCheck,
    title: "Team access",
    label: "Controls",
    description: "Assign precise permissions for managers, office staff, and accountants.",
    accent: "border-l-amber-500",
    iconClassName: "border-amber-100 bg-amber-50 text-amber-700",
  },
] as const;

const SNAPSHOT_ITEMS: readonly SnapshotItem[] = [
  {
    icon: Layers3,
    label: "Roles",
    value: "Access",
    iconClassName: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
  {
    icon: CreditCard,
    label: "Rent",
    value: "Billing",
    iconClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  {
    icon: Droplets,
    label: "Water",
    value: "Meters",
    iconClassName: "border-sky-100 bg-sky-50 text-sky-700",
  },
  {
    icon: ClipboardList,
    label: "Checks",
    value: "Status",
    iconClassName: "border-amber-100 bg-amber-50 text-amber-700",
  },
] as const;

const CONTROLS: readonly ControlItem[] = [
  {
    icon: LockKeyhole,
    title: "Permissions",
    detail: "Role based",
    iconClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  {
    icon: FileCheck2,
    title: "Workflows",
    detail: "Documented",
    iconClassName: "border-sky-100 bg-sky-50 text-sky-700",
  },
  {
    icon: ShieldCheck,
    title: "Records",
    detail: "Auditable",
    iconClassName: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
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
        "rounded-2xl border border-neutral-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.035)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {children}
    </div>
  );
}

function IconBox({
  icon: Icon,
  className,
}: {
  icon: IconType;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border sm:h-8 sm:w-8 lg:h-8 lg:w-8",
        className ?? "border-neutral-200 bg-white text-neutral-900",
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function OperationsPanel() {
  return (
    <ShellCard className="flex min-h-0 flex-col p-4 sm:p-5 lg:p-4">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4 sm:pb-5 lg:pb-3">
        <div className="min-w-0">
          <p
            id="operations-showcase-title"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700"
          >
            Operations command center
          </p>
          <p className="mt-1.5 max-w-xl text-base font-semibold leading-6 text-neutral-950 sm:text-lg sm:leading-7 lg:text-base lg:leading-5">
            A structured workspace for billing, inspections, tenants, staff, and records.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Live
        </span>
      </div>

      <div className="mt-4 grid min-h-0 grid-cols-1 gap-3.5 sm:grid-cols-2 lg:mt-3 lg:gap-3">
        {OPERATIONS.map(({ icon, title, label, description, accent, iconClassName }) => (
          <article
            key={title}
            className={cx(
              "min-w-0 rounded-xl border border-l-2 border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 lg:p-3",
              accent,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <IconBox icon={icon} className={iconClassName} />
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                {label}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-neutral-950">
              {title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-5 text-neutral-600 lg:line-clamp-2 lg:text-xs lg:leading-4">
              {description}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto_auto] sm:items-center lg:mt-3 lg:gap-2">
        <div className="text-xs text-neutral-600">
          Built for daily property operations.
        </div>
        <Link
          href="/register"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 sm:min-h-10 sm:text-xs lg:min-h-9 lg:px-3 lg:py-2"
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 sm:min-h-10 sm:text-xs lg:min-h-9 lg:px-3 lg:py-2"
        >
          Sign in
        </Link>
      </div>
    </ShellCard>
  );
}

function WorkspacePanel() {
  return (
    <ShellCard className="flex min-h-0 flex-col p-4 sm:p-5 lg:p-4">
      <div className="flex items-start justify-between gap-3 border-b border-neutral-200 pb-4 lg:pb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950">Workspace overview</p>
          <p className="mt-1 text-xs text-neutral-500">Essential modules at a glance</p>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-700">
          Active
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-3.5 lg:mt-3 lg:grid-cols-2 lg:gap-2">
        {SNAPSHOT_ITEMS.map(({ icon, label, value, iconClassName }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 lg:p-2.5"
          >
            <IconBox icon={icon} className={iconClassName} />
            <p className="mt-2 text-xs font-semibold text-neutral-950">{label}</p>
            <p className="text-[11px] text-neutral-500 lg:text-[10px]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:mt-3 lg:grid-cols-1 lg:gap-2">
        {CONTROLS.map(({ icon, title, detail, iconClassName }) => (
          <div
            key={title}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 lg:gap-2 lg:p-2.5"
          >
            <IconBox icon={icon} className={iconClassName} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-950">{title}</p>
              <p className="text-[11px] text-neutral-500 lg:text-[10px]">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </ShellCard>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article
      className={cx(
        "relative min-w-0 rounded-xl border bg-white p-4 transition-colors hover:border-neutral-300 lg:p-2.5",
        plan.featured ? "border-emerald-300 bg-emerald-50/45" : "border-neutral-200",
      )}
    >
      {plan.featured ? (
        <span className="absolute right-3 top-3 rounded-full bg-emerald-700 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white lg:right-2 lg:top-2 lg:text-[7px]">
          Best
        </span>
      ) : null}

      <div className="pr-12 lg:pr-9">
        <h3 className="text-sm font-semibold text-neutral-950 lg:text-xs">{plan.name}</h3>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500 lg:text-[9px]">
          {plan.note}
        </p>
      </div>

      <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-neutral-950 lg:mt-2 lg:text-lg">
        {plan.price}
      </p>

      <ul className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3 lg:mt-2 lg:space-y-1 lg:pt-2">
        {plan.points.map((point) => (
          <li
            key={point}
            className="flex items-center gap-2 text-xs text-neutral-600 lg:gap-1.5 lg:text-[10px]"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 lg:h-3.5 lg:w-3.5">
              <Check className="h-2.5 w-2.5 text-emerald-700" />
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PlansSection() {
  return (
    <ShellCard className="p-4 lg:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
            <WalletCards className="h-3.5 w-3.5" />
            Pricing
          </div>
          <h2 className="mt-1 text-base font-semibold text-neutral-950 lg:text-base">
            Plans for every portfolio
          </h2>
        </div>

        <Link
          href="/pricing"
          aria-label="View pricing plans"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 transition hover:border-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          View
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:mt-3 lg:grid-cols-4 lg:gap-2">
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
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
      className="relative min-h-[100dvh] w-full overflow-x-hidden bg-white text-neutral-950 lg:h-[100dvh] lg:overflow-hidden"
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-px bg-neutral-950"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col gap-4 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:grid lg:h-full lg:min-h-0 lg:grid-rows-[auto_1fr_auto] lg:gap-3 lg:px-8 lg:py-4">
        <header className="flex items-center justify-between gap-3 bg-white">
          <Link
            href="/"
            aria-label="Go to EstateDesk home"
            className="inline-flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-950 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white">
              <Building2 className="h-5 w-5 text-emerald-700" />
            </span>
            <span className="truncate">EstateDesk</span>
          </Link>

          {standalone ? (
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 transition hover:border-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          ) : null}
        </header>

        <main className="flex min-h-0 flex-col gap-4 bg-white lg:grid lg:grid-rows-[auto_1fr_auto] lg:gap-3">
          <SectionLabel>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
            <span className="truncate">Property operations software</span>
          </SectionLabel>

          <div className="grid min-h-0 gap-4 bg-white lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:gap-3">
            <OperationsPanel />
            <WorkspacePanel />
          </div>

          {!compact ? <PlansSection /> : null}
        </main>

        <footer className="flex items-center justify-between gap-3 bg-white pb-1 text-[10px] text-neutral-500 lg:pb-0">
          <span>© {currentYear} EstateDesk.</span>
          <span className="hidden sm:inline-flex">Professional property workspace</span>
        </footer>
      </div>
    </section>
  );
}
