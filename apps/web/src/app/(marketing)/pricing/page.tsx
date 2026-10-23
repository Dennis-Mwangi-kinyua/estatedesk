import { publicPrimaryAction, publicSecondaryAction } from "@/components/marketing/public-action";
import type { Metadata } from "next";
import Link from "next/link";
import { serializeJsonForHtml } from "@/lib/security/safe-json";
import { Check, Layers3, FileBarChart2, X } from "lucide-react";
import { Building2, WalletCards as CreditCard, ShieldCheck, ClipboardList, Droplets, WalletCards } from "@/components/shared/colored-icons";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { APP_PLAN_ORDER, APP_PLANS } from "@/lib/billing/plans";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "EstateDesk Pricing for Kenya, East Africa and Dubai",
  description:
    "Compare EstateDesk property management software pricing for Kenya, East Africa, Dubai, the UAE, and global rental teams: Free, Pro at KES 3,000 per month, Plus at KES 6,500 per month, and Custom plans.",
  path: "/pricing",
  keywords: [
    "EstateDesk pricing",
    "property management software pricing Kenya",
    "property management software pricing East Africa",
    "property management software pricing Dubai",
    "property management software pricing UAE",
    "landlord software pricing Kenya",
    "rent management system pricing",
    "tenant management software cost Kenya",
  ],
});

function formatPlanPrice(amount: number) {
  if (amount === 0) return "KES 0";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLimit(limit: number, label: string) {
  if (limit === Number.MAX_SAFE_INTEGER) return `Unlimited ${label}`;

  return `${limit.toLocaleString()} ${label}`;
}

const plans = APP_PLAN_ORDER.map((key) => ({
  key,
  ...APP_PLANS[key],
  featured: key === "PRO",
  price:
    key === "ENTERPRISE"
      ? "Custom"
      : formatPlanPrice(APP_PLANS[key].monthlyAmount),
  period: key === "ENTERPRISE" ? "" : "/month",
}));

const highlights = [
  {
    icon: Building2,
    title: "Organization-based billing",
    text: "Subscriptions are tied to each organization workspace, making plan management clean and scalable.",
  },
  {
    icon: CreditCard,
    title: "Plans that grow with you",
    text: "Compare the limits and features above, then discuss the right plan for your portfolio with our team.",
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
  const pricingJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${absoluteUrl("/pricing")}#software`,
        name: "EstateDesk",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: absoluteUrl("/pricing"),
        areaServed: {
          "@type": "Country",
          name: "Kenya",
        },
        availableLanguage: "English",
        offers: plans.map((plan) => ({
          "@type": "Offer",
          name: `${plan.name} plan`,
          url: absoluteUrl(plan.href),
          priceCurrency: "KES",
          ...(plan.key === "ENTERPRISE" ? {} : { price: String(plan.monthlyAmount) }),
          category: plan.key === "ENTERPRISE" ? "Custom SaaS plan" : "SaaS subscription",
          availability: "https://schema.org/InStock",
        })),
      },
    ],
  };

  return (
    <main className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(pricingJsonLd) }}
      />
      <PublicAccessHeader active="pricing" />

      <section className="border-b border-neutral-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fb_100%)] dark:border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-600">
              <ShieldCheck className="h-4 w-4" />
              Pricing built around your billing model
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-5xl">
              Clear tiers for property operations teams
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-600">
              Choose what your organization needs today, then scale from
              records and tenant tracking into reports, inspections, move-outs,
              exports, and custom rollout support.
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
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-neutral-950">
                      {plan.name}
                    </p>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
                      {plan.badge}
                    </span>
                  </div>
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
                  data-conversion-event="pricing_plan_cta_click"
                  className={`mt-6 w-full ${plan.featured ? publicPrimaryAction : publicSecondaryAction}`}
                >
                  {plan.key === "ENTERPRISE" ? "Contact sales" : `Request ${plan.name} access`}
                </Link>

                <div className="mt-6 border-t border-neutral-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Limits
                  </p>

                  <div className="mt-4 grid gap-2 text-sm text-neutral-700">
                    <PlanLimit
                      label={formatLimit(plan.propertiesLimit, "properties")}
                    />
                    <PlanLimit label={formatLimit(plan.unitsLimit, "units and BnB listings combined")} />
                    <PlanLimit
                      label={formatLimit(plan.usersLimit, "internal users")}
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-neutral-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    What’s included
                  </p>

                  <div className="mt-4 space-y-3">
                    {plan.included.map((feature) => (
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

                  {plan.excluded.length > 0 ? (
                    <div className="mt-5 space-y-3 border-t border-neutral-100 pt-5">
                      {plan.excluded.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-start gap-3 text-sm text-neutral-400"
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                            <X className="h-3.5 w-3.5" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  Before you request access
                </p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  Prices are per organization workspace, per month, in Kenyan shillings.
                  Your request is reviewed before workspace access is arranged.
                  Confirm payment provider charges, applicable taxes and any guided setup costs with the team before activation.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-600">
                <WalletCards className="h-4 w-4" />
                FREE · PRO · PLUS · CUSTOM
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-12 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Choose your coverage
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-neutral-950">
              Find the tools your team needs
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

      <section aria-labelledby="billing-questions" className="mx-auto max-w-4xl px-5 py-12 sm:px-6">
        <h2 id="billing-questions" className="text-2xl font-semibold">Billing and onboarding questions</h2>
        <div className="mt-6 space-y-3">
          <details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold">What happens after I choose a plan?</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">Submit an access request. Our team reviews your portfolio needs and contacts you to agree your workspace setup and sign-in details.</p></details>
          <details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold">Are payment and setup costs included?</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">The listed amounts are workspace subscription prices. Confirm any payment provider fees, taxes, migration or guided onboarding costs with sales for your setup.</p></details>
          <details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold">How do changes, cancellation and refunds work?</summary><p className="mt-3 text-sm leading-7 text-muted-foreground">Review the <Link href="/terms" className="font-semibold underline">terms of service</Link> and confirm the billing, renewal, cancellation and refund terms for your plan with the team before activation.</p></details>
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
              data-conversion-event="pricing_registration_cta_click"
              className={publicPrimaryAction}
            >
              Request access
            </Link>

            <Link
              href="/contact"
              data-conversion-event="pricing_contact_cta_click"
              className={publicSecondaryAction}
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>
      <PublicAccessFooter />
    </main>
  );
}

function PlanLimit({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200">
      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
      <span>{label}</span>
    </div>
  );
}
