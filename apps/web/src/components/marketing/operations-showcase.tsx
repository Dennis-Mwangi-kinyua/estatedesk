import Link from "next/link";
import { type ElementType, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  Check,
  ClipboardList,
  CreditCard,
  Droplets,
  FileCheck2,
  Home,
  KeyRound,
  Layers3,
  LockKeyhole,
  MapPin,
  PhoneCall,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { APP_PLAN_ORDER, APP_PLANS } from "@/lib/billing/plans";

type OperationsShowcaseProps = {
  standalone?: boolean;
  compact?: boolean;
  publicHeaderActive?: "home" | "services";
  variant?: "operations" | "rentals";
  showPricingNav?: boolean;
  showFooter?: boolean;
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
  href?: string;
  featured?: boolean;
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

function formatPlanPrice(amount: number) {
  if (amount === 0) return "KES 0";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPlanLimit(limit: number, label: string) {
  if (limit === Number.MAX_SAFE_INTEGER) return `Unlimited ${label}`;

  return `${limit.toLocaleString()} ${label}`;
}

const PLANS: readonly Plan[] = APP_PLAN_ORDER.map((key) => {
  const plan = APP_PLANS[key];

  return {
    name: plan.name,
    price: key === "ENTERPRISE" ? "Custom" : formatPlanPrice(plan.monthlyAmount),
    note: plan.badge,
    points: [
      formatPlanLimit(plan.propertiesLimit, "properties"),
      formatPlanLimit(plan.unitsLimit, "units"),
    ],
    featured: key === "PRO",
  };
});

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

const RENTAL_STEPS: readonly OperationCard[] = [
  {
    icon: Search,
    title: "Find vacancies",
    label: "Search",
    description: "Browse available homes by location, rent range, property, and unit details.",
    accent: "border-l-sky-500",
    iconClassName: "border-sky-100 bg-sky-50 text-sky-700",
    href: "/vacancies",
    featured: true,
  },
  {
    icon: Home,
    title: "Review the unit",
    label: "Details",
    description: "Check rent, rooms, service charges, photos, and manager contact information.",
    accent: "border-l-emerald-500",
    iconClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  {
    icon: CalendarCheck2,
    title: "Book a viewing",
    label: "Visit",
    description: "Contact the listed landlord or manager to confirm availability and viewing terms.",
    accent: "border-l-amber-500",
    iconClassName: "border-amber-100 bg-amber-50 text-amber-700",
  },
  {
    icon: KeyRound,
    title: "Move in with records",
    label: "Lease",
    description: "Once approved, tenant details, lease records, and billing can be managed digitally.",
    accent: "border-l-indigo-500",
    iconClassName: "border-indigo-100 bg-indigo-50 text-indigo-700",
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

const RENTAL_SNAPSHOT_ITEMS: readonly SnapshotItem[] = [
  {
    icon: MapPin,
    label: "Location",
    value: "Search areas",
    iconClassName: "border-sky-100 bg-sky-50 text-sky-700",
  },
  {
    icon: CreditCard,
    label: "Rent",
    value: "Compare costs",
    iconClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  {
    icon: Home,
    label: "Unit",
    value: "View details",
    iconClassName: "border-amber-100 bg-amber-50 text-amber-700",
  },
  {
    icon: PhoneCall,
    label: "Enquiry",
    value: "Contact manager",
    iconClassName: "border-indigo-100 bg-indigo-50 text-indigo-700",
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

const RENTAL_CONTROLS: readonly ControlItem[] = [
  {
    icon: ShieldCheck,
    title: "Published listings",
    detail: "Manager posted",
    iconClassName: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  {
    icon: CalendarCheck2,
    title: "Viewing steps",
    detail: "Confirmed direct",
    iconClassName: "border-sky-100 bg-sky-50 text-sky-700",
  },
  {
    icon: FileCheck2,
    title: "Tenant records",
    detail: "Ready after approval",
    iconClassName: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
] as const;

const SHOWCASE_COPY = {
  operations: {
    sectionLabel: "Property operations software",
    panelKicker: "Operations command center",
    panelTitle: "A structured workspace for billing, inspections, tenants, staff, and records.",
    status: "Live",
    helperText: "Built for daily property operations.",
    primaryCta: { href: "/register", label: "Create account" },
    secondaryCta: { href: "/login", label: "Sign in" },
    workspaceTitle: "Workspace overview",
    workspaceSubtitle: "Essential modules at a glance",
    workspaceStatus: "Active",
    footerTagline: "Professional property workspace",
    operations: OPERATIONS,
    snapshotItems: SNAPSHOT_ITEMS,
    controls: CONTROLS,
  },
  rentals: {
    sectionLabel: "Rent or find a property",
    panelKicker: "Rental discovery workspace",
    panelTitle: "Search vacant homes, compare unit details, contact managers, and move in with clear records.",
    status: "Open",
    helperText: "Built for tenants looking for a reliable place to rent.",
    primaryCta: { href: "/vacancies", label: "View vacancies" },
    secondaryCta: { href: "/login", label: "Tenant sign in" },
    workspaceTitle: "Rental overview",
    workspaceSubtitle: "The search journey at a glance",
    workspaceStatus: "Ready",
    footerTagline: "Professional rental discovery",
    operations: RENTAL_STEPS,
    snapshotItems: RENTAL_SNAPSHOT_ITEMS,
    controls: RENTAL_CONTROLS,
  },
} as const;

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
        "rounded-2xl border border-neutral-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.035)] dark:border-white/12 dark:bg-[#121821] dark:text-slate-100 dark:shadow-[0_18px_42px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-neutral-200 bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.07] dark:text-slate-200">
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
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border sm:h-8 sm:w-8 lg:h-8 lg:w-8",
        className ?? "border-neutral-200 bg-white text-neutral-900 dark:border-white/12 dark:bg-white/[0.08] dark:text-slate-100",
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function RentalSearchStrip() {
  return (
    <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:grid-cols-[1fr_0.9fr_auto] dark:border-white/12 dark:bg-white/[0.08] dark:shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200/80 bg-white px-3 lg:min-h-11 lg:px-4 dark:border-white/12 dark:bg-[#18202a]">
        <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-300" />
        <span className="min-w-0 truncate text-sm font-medium text-slate-500 dark:text-slate-300">
          Search by estate, area, or property
        </span>
      </div>
      <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200/80 bg-white px-3 lg:min-h-11 lg:px-4 dark:border-white/12 dark:bg-[#18202a]">
        <MapPin className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-300" />
        <span className="min-w-0 truncate text-sm font-medium text-slate-500 dark:text-slate-300">
          Choose location
        </span>
      </div>
      <Link
        href="/vacancies"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 lg:min-h-11 lg:px-5 dark:bg-emerald-400 dark:text-[#07130f] dark:hover:bg-emerald-300"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Browse
      </Link>
    </div>
  );
}

function OperationsPanel({
  copy,
  variant,
}: {
  copy: (typeof SHOWCASE_COPY)[keyof typeof SHOWCASE_COPY];
  variant: OperationsShowcaseProps["variant"];
}) {
  const isRental = variant === "rentals";

  return (
    <ShellCard
      className={cx(
        "flex min-h-0 flex-col p-4 sm:p-5 lg:h-full lg:p-4 xl:p-5 dark:border-white/12 dark:bg-[#121821]",
        isRental &&
          "rounded-xl border-slate-200/90 bg-white/86 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:border-white/12 dark:bg-[#121821]/92 dark:shadow-[0_24px_70px_rgba(0,0,0,0.30)]",
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200/80 pb-4 sm:pb-5 lg:pb-3">
        <div className="min-w-0">
          <p
            id="operations-showcase-title"
            className={cx(
              "text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px] sm:tracking-[0.2em]",
              isRental ? "text-sky-700 dark:text-sky-300" : "text-emerald-700 dark:text-emerald-300",
            )}
          >
            {copy.panelKicker}
          </p>
          <p className="mt-2 max-w-[22rem] text-[1.18rem] font-semibold leading-6 text-neutral-950 sm:max-w-3xl sm:text-lg sm:leading-7 lg:text-xl lg:leading-7 xl:text-2xl xl:leading-8 dark:text-slate-50">
            {copy.panelTitle}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-200">
          {copy.status}
        </span>
      </div>

      {isRental ? (
        <div className="mt-4 lg:mt-3">
          <RentalSearchStrip />
        </div>
      ) : null}

      <div className="mt-4 grid min-h-0 grid-cols-1 gap-3.5 sm:grid-cols-2 lg:mt-3 lg:flex-1 lg:gap-3 xl:gap-4">
        {copy.operations.map(({ icon, title, label, description, accent, iconClassName, href, featured }) => {
          const cardClassName = cx(
            "min-w-0 rounded-lg border border-l-2 border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 lg:flex lg:min-h-0 lg:flex-col lg:p-4 dark:border-white/12 dark:bg-[#18202a] dark:hover:border-white/22",
            isRental && "border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.055)] backdrop-blur dark:border-white/12 dark:bg-[#18202a] dark:shadow-none",
            featured &&
              "ring-2 ring-sky-200/80 shadow-[0_16px_38px_rgba(14,165,233,0.20)] hover:border-sky-300 hover:ring-sky-300/90 dark:ring-sky-300/35 dark:shadow-[0_0_34px_rgba(56,189,248,0.22)] dark:hover:border-sky-300/45",
            accent,
          );
          const content = (
            <>
            <div className="flex items-start justify-between gap-3">
              <IconBox icon={icon} className={iconClassName} />
              <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:border-white/12 dark:bg-white/[0.06] dark:text-slate-300">
                {label}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-neutral-950 lg:mt-3 lg:text-[15px] dark:text-slate-50">
              {title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-5 text-neutral-600 lg:line-clamp-2 lg:text-xs lg:leading-5 xl:text-[13px] dark:text-slate-300">
              {description}
            </p>
            </>
          );

          return href ? (
            <Link
              key={title}
              href={href}
              aria-label="View vacant houses"
              className={cx(cardClassName, "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-[#0d1117]")}
            >
              {content}
            </Link>
          ) : (
            <article key={title} className={cardClassName}>
              {content}
            </article>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto_auto] sm:items-center lg:mt-3 lg:gap-3">
        <div className="text-xs text-neutral-600 dark:text-slate-300">
          {copy.helperText}
        </div>
        <Link
          href={copy.primaryCta.href}
          className="inline-flex w-full min-h-11 items-center justify-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 sm:w-auto sm:min-h-10 sm:text-xs lg:px-4 dark:bg-white dark:text-[#0b0f16] dark:hover:bg-slate-200 dark:focus-visible:ring-white"
        >
          {copy.primaryCta.label}
        </Link>
        <Link
          href={copy.secondaryCta.href}
          className="inline-flex w-full min-h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 sm:w-auto sm:min-h-10 sm:text-xs lg:px-4 dark:border-white/14 dark:bg-white/[0.08] dark:text-slate-100 dark:hover:border-white/26 dark:hover:bg-white/[0.13] dark:focus-visible:ring-white"
        >
          {copy.secondaryCta.label}
        </Link>
      </div>
    </ShellCard>
  );
}

function WorkspacePanel({
  copy,
  variant,
}: {
  copy: (typeof SHOWCASE_COPY)[keyof typeof SHOWCASE_COPY];
  variant: OperationsShowcaseProps["variant"];
}) {
  const isRental = variant === "rentals";

  return (
    <ShellCard
      className={cx(
        "flex min-h-0 flex-col p-4 sm:p-5 lg:h-full lg:p-4 xl:p-5 dark:border-white/12 dark:bg-[#121821]",
        isRental &&
          "rounded-xl border-slate-200/90 bg-white/82 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/12 dark:bg-[#121821]/90 dark:shadow-[0_24px_70px_rgba(0,0,0,0.26)]",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-neutral-200/80 pb-4 lg:pb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950 lg:text-[15px] dark:text-slate-50">{copy.workspaceTitle}</p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-slate-300">{copy.workspaceSubtitle}</p>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-300/25 dark:bg-sky-400/10 dark:text-sky-200">
          {copy.workspaceStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:mt-3 lg:grid-cols-2 lg:gap-2.5">
        {copy.snapshotItems.map(({ icon, label, value, iconClassName }) => (
          <div
            key={label}
            className={cx(
              "min-w-0 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 lg:p-3 dark:border-white/12 dark:bg-[#18202a] dark:hover:border-white/22",
              isRental && "border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.045)] dark:border-white/12 dark:bg-[#18202a] dark:shadow-none",
            )}
          >
            <IconBox icon={icon} className={iconClassName} />
            <p className="mt-2 text-xs font-semibold text-neutral-950 dark:text-slate-50">{label}</p>
            <p className="text-[11px] text-neutral-500 dark:text-slate-300">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:mt-3 lg:flex-1 lg:grid-cols-1 lg:gap-2.5">
        {copy.controls.map(({ icon, title, detail, iconClassName }) => (
          <div
            key={title}
            className={cx(
              "flex min-w-0 items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 lg:gap-3 lg:p-3 dark:border-white/12 dark:bg-[#18202a] dark:hover:border-white/22",
              isRental && "border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.045)] dark:border-white/12 dark:bg-[#18202a] dark:shadow-none",
            )}
          >
            <IconBox icon={icon} className={iconClassName} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-950 dark:text-slate-50">{title}</p>
              <p className="text-[11px] text-neutral-500 dark:text-slate-300">{detail}</p>
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
  publicHeaderActive = "services",
  variant = "operations",
  showPricingNav = true,
  showFooter = true,
}: OperationsShowcaseProps) {
  const copy = SHOWCASE_COPY[variant];
  const isRental = variant === "rentals";

  return (
    <>
      {standalone ? (
        <PublicAccessHeader active={publicHeaderActive} showPricing={showPricingNav} />
      ) : null}
      <section
        aria-labelledby="operations-showcase-title"
        className={cx(
          "relative min-h-dvh w-full overflow-x-hidden text-neutral-950 dark:text-slate-50 lg:overflow-hidden",
          standalone ? "lg:h-[calc(100svh-65px)] lg:min-h-[calc(100svh-65px)]" : "lg:h-screen",
          isRental
            ? "bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_48%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#0d1117_0%,#101923_48%,#0d1117_100%)]"
            : "bg-white dark:bg-[#0d1117]",
        )}
      >
      <div
        className={cx(
          "pointer-events-none absolute inset-y-0 right-0 z-20 w-px",
          isRental ? "bg-white/50 dark:bg-white/8" : "bg-neutral-950 dark:bg-white/12",
        )}
        aria-hidden="true"
      />

      <div
        className={cx(
            "relative z-10 mx-auto flex w-full max-w-[1536px] flex-col gap-4 px-3 py-3 sm:px-5 sm:py-5 md:px-6 lg:h-full lg:gap-5 lg:px-8 lg:py-7 xl:py-8",
          isRental ? "bg-transparent" : "bg-white dark:bg-[#0d1117]",
        )}
      >
        {!standalone ? (
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
          </header>
        ) : null}

        <main
          className={cx(
            "flex min-h-0 flex-col gap-4 lg:grid lg:flex-1 lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:gap-5",
            isRental ? "bg-transparent" : "bg-white dark:bg-[#0d1117]",
          )}
        >
          <SectionLabel>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
            <span className="truncate">{copy.sectionLabel}</span>
          </SectionLabel>

          <div
            className={cx(
              "grid min-h-0 gap-4 md:gap-5 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.38fr)] xl:min-h-[620px] xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.36fr)]",
              isRental ? "bg-transparent" : "bg-white dark:bg-[#0d1117]",
            )}
          >
            <OperationsPanel copy={copy} variant={variant} />
            <WorkspacePanel copy={copy} variant={variant} />
          </div>

          {!compact && !isRental ? <PlansSection /> : null}
        </main>
      </div>
      </section>
      {standalone && showFooter ? <PublicAccessFooter /> : null}
    </>
  );
}
