import Link from "next/link";
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
  WalletCards,
} from "lucide-react";

type OperationsShowcaseProps = {
  standalone?: boolean;
};

const plans = [
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
];

export default function OperationsShowcase({
  standalone = false,
}: OperationsShowcaseProps) {
  return (
    <section
      className={
        standalone
          ? "relative h-dvh overflow-y-auto bg-[#0b1220] text-white"
          : "relative hidden h-dvh overflow-hidden bg-[#0b1220] text-white lg:flex"
      }
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)_22%,rgba(0,0,0,0.16)_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="relative z-10 flex min-h-full w-full flex-col px-5 py-5 sm:px-6 sm:py-6 lg:h-full lg:px-10 lg:py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/90"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Building2 className="h-5 w-5" />
            </div>
            <span>EstateDesk</span>
          </Link>

          {standalone ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          ) : null}
        </div>

        <div className="mt-6 flex flex-1 flex-col">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/70">
            <ShieldCheck className="h-4 w-4" />
            Trusted software for property operations
          </div>

          <div className="mt-5 grid gap-4 lg:grid-rows-[auto_auto_1fr]">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 lg:p-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
                  EstateDesk platform
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]">
                  A structured system for modern property management
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 lg:text-[15px]">
                  Manage rent collection, water billing, inspections, tenant
                  records, and staff workflows from one operational workspace.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 lg:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      Workspace snapshot
                    </p>
                    <p className="mt-1 text-sm text-white/50">
                      Built for reliable daily operations
                    </p>
                  </div>

                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                    Active
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-3.5">
                    <Layers3 className="h-4 w-4 text-white/70" />
                    <p className="mt-2 text-sm font-medium text-white">
                      Role routing
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-3.5">
                    <CreditCard className="h-4 w-4 text-white/70" />
                    <p className="mt-2 text-sm font-medium text-white">
                      Rent billing
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-3.5">
                    <Droplets className="h-4 w-4 text-white/70" />
                    <p className="mt-2 text-sm font-medium text-white">
                      Water billing
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-3.5">
                    <ClipboardList className="h-4 w-4 text-white/70" />
                    <p className="mt-2 text-sm font-medium text-white">
                      Inspections
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 lg:p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Access
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  Structured permissions
                </p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Support for administrators, managers, accountants,
                  caretakers, office teams, and tenants.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 lg:p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Workflow
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  End-to-end control
                </p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  From occupancy and lease administration to billing, support,
                  follow-up, and reporting.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 lg:p-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                  Governance
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  Accountable by design
                </p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Clear records, controlled actions, and dependable operational
                  visibility.
                </p>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 lg:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/72">
                    <WalletCards className="h-3.5 w-3.5" />
                    Plans
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Choose the setup that fits your team
                  </h2>
                </div>

                <Link
                  href="/pricing"
                  className="hidden items-center gap-2 text-sm font-medium text-white/78 transition hover:text-white xl:inline-flex"
                >
                  View pricing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-3 xl:grid-cols-4">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-[20px] border px-4 py-4 ${
                      plan.featured
                        ? "border-sky-300/25 bg-sky-400/10"
                        : "border-white/10 bg-black/15"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-white">
                          {plan.name}
                        </p>
                        <p className="mt-1 text-[11px] text-white/48">
                          {plan.note}
                        </p>
                      </div>

                      {plan.featured ? (
                        <div className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-200">
                          Popular
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <p className="text-[1.5rem] font-semibold tracking-[-0.03em] text-white">
                        {plan.price}
                      </p>
                    </div>

                    <div className="mt-3 space-y-2">
                      {plan.points.map((point) => (
                        <div
                          key={point}
                          className="flex items-start gap-2 text-[13px] text-white/70"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/pricing"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/78 transition hover:text-white xl:hidden"
              >
                View pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {standalone ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-neutral-950 transition hover:bg-white/90"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Create account
            </Link>
          </div>
        ) : null}

        <div className="mt-5 text-xs text-white/35">
          © {new Date().getFullYear()} EstateDesk. All rights reserved.
        </div>
      </div>
    </section>
  );
}