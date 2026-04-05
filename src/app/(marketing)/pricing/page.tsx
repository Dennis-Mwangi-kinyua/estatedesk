import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  ShieldCheck,
  Layers3,
  ClipboardList,
  Droplets,
  FileBarChart2,
  WalletCards,
} from "lucide-react";

const plans = [
  {
    name: "Free",
    key: "FREE",
    price: "KES 0",
    period: "/month",
    description:
      "For small landlords getting started with structured property records.",
    cta: "Start free",
    href: "/register",
    featured: false,
    features: [
      "Organization workspace",
      "Property and unit records",
      "Tenant profiles",
      "Basic lease tracking",
      "Standard access control",
    ],
  },
  {
    name: "Pro",
    key: "PRO",
    price: "KES 4,500",
    period: "/month",
    description:
      "For active teams managing rent, water billing, and day-to-day operations.",
    cta: "Choose Pro",
    href: "/register?plan=pro",
    featured: true,
    features: [
      "Everything in Free",
      "Rent charge management",
      "Water billing workflows",
      "Payment tracking",
      "Notifications and reminders",
      "Issue ticket handling",
    ],
  },
  {
    name: "Plus",
    key: "PLUS",
    price: "KES 9,500",
    period: "/month",
    description:
      "For growing portfolios that need stronger coordination and reporting.",
    cta: "Choose Plus",
    href: "/register?plan=plus",
    featured: false,
    features: [
      "Everything in Pro",
      "Caretaker assignments",
      "Inspection workflows",
      "Move-out notices",
      "Audit visibility",
      "Operational reporting",
    ],
  },
  {
    name: "Enterprise",
    key: "ENTERPRISE",
    price: "Custom",
    period: "",
    description:
      "For large organizations that need tailored rollout, governance, and support.",
    cta: "Contact sales",
    href: "/contact",
    featured: false,
    features: [
      "Everything in Plus",
      "Custom onboarding",
      "Advanced implementation support",
      "Enterprise billing setup",
      "Priority support",
      "Custom configuration guidance",
    ],
  },
];

const highlights = [
  {
    icon: Building2,
    title: "Organization-based billing",
    text: "Subscriptions are tied to each organization workspace, making plan management clean and scalable.",
  },
  {
    icon: CreditCard,
    title: "Structured plan lifecycle",
    text: "Plan status, billing periods, trials, cancellations, and upgrades align with the subscription model.",
  },
  {
    icon: Layers3,
    title: "Role-aware operations",
    text: "Support for admins, managers, office teams, accountants, caretakers, and tenants.",
  },
  {
    icon: ClipboardList,
    title: "Operational workflows",
    text: "Leases, inspections, move-out processes, issue tickets, and task visibility in one system.",
  },
  {
    icon: Droplets,
    title: "Billing coverage",
    text: "Rent charges, water bills, tax charges, and payment verification fit naturally into paid plans.",
  },
  {
    icon: FileBarChart2,
    title: "Audit and reporting readiness",
    text: "Audit logs, notifications, receipts, and plan change history support accountability.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-dvh bg-[#f5f7fb] text-neutral-950">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-sm font-semibold tracking-[-0.02em] text-neutral-950"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                <Building2 className="h-5 w-5" />
              </div>
              <span>EstateDesk</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#0b1720] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#10202c]"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600">
              <ShieldCheck className="h-4 w-4" />
              Pricing built around your billing model
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-5xl">
              Clear pricing for property operations teams
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-600">
              Choose a plan that matches the way your organization manages
              properties, tenants, leases, billing, inspections, and internal
              operations.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-5 xl:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-[28px] border bg-white p-6 shadow-sm transition ${
                  plan.featured
                    ? "border-sky-200 shadow-[0_20px_50px_rgba(37,99,235,0.10)]"
                    : "border-neutral-200"
                }`}
              >
                {plan.featured ? (
                  <div className="absolute -top-3 left-6 rounded-full bg-sky-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    Most popular
                  </div>
                ) : null}

                <div className="flex min-h-[88px] flex-col">
                  <p className="text-lg font-semibold text-neutral-950">
                    {plan.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-[-0.04em] text-neutral-950">
                    {plan.price}
                  </span>
                  {plan.period ? (
                    <span className="pb-1 text-sm text-neutral-500">
                      {plan.period}
                    </span>
                  ) : null}
                </div>

                <Link
                  href={plan.href}
                  className={`mt-6 inline-flex min-h-[50px] w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition ${
                    plan.featured
                      ? "bg-[#0b1720] text-white hover:bg-[#10202c]"
                      : "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="mt-6 border-t border-neutral-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Included
                  </p>

                  <div className="mt-4 space-y-3">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 text-sm text-neutral-700"
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  Billing model alignment
                </p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  Plans map directly to the platform subscription layer, which
                  supports billing periods, plan changes, cancellation windows,
                  and organization-level plan ownership.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-600">
                <WalletCards className="h-4 w-4" />
                FREE · PRO · PLUS · ENTERPRISE
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Why these plans fit the product
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-neutral-950">
              Pricing that reflects how EstateDesk is structured
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-neutral-200 bg-[#fbfcfe] p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-800">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-neutral-950">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-[#f8fafc] py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-neutral-950">
            Ready to set up your workspace?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            Start with Free, move to Pro or Plus as operations grow, or talk to
            us about Enterprise rollout for larger teams.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#0b1720] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#10202c]"
            >
              Create account
            </Link>

            <Link
              href="/contact"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}