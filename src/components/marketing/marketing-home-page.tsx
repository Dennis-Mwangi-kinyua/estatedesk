import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Droplets, ReceiptText, Wrench } from "lucide-react";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { faqJsonLd, marketingFaqItems } from "@/components/marketing/seo-faq";
import { absoluteUrl } from "@/lib/seo";

const workflows = [
  {
    title: "Tenants and leases",
    body: "Keep occupants, units, leases, move-ins, move-outs, and history connected.",
    icon: Building2,
  },
  {
    title: "Rent and balances",
    body: "Track charges, payments, arrears, verification, and monthly follow-up.",
    icon: ReceiptText,
  },
  {
    title: "Water billing",
    body: "Record readings, create tenant bills, and review billing history.",
    icon: Droplets,
  },
  {
    title: "Maintenance",
    body: "Coordinate tenant issues, caretaker work, inspections, and closure records.",
    icon: Wrench,
  },
];

const proofPoints = [
  "Role-aware access for admins, managers, accountants, caretakers, tenants, and landlords.",
  "Mobile-first workflows for office teams, field staff, and remote owners.",
  "Public vacancy pages remain searchable while private dashboard data stays protected.",
];

export default function MarketingHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl("/")}#organization`,
        name: "EstateDesk",
        url: absoluteUrl("/"),
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${absoluteUrl("/")}#software`,
        name: "EstateDesk",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: absoluteUrl("/"),
        description:
          "Property management software for tenants, leases, rent, water bills, maintenance, vacancies, reports, and role-aware staff access.",
        offers: {
          "@type": "Offer",
          category: "SaaS subscription",
          priceCurrency: "KES",
          url: absoluteUrl("/pricing"),
        },
      },
      faqJsonLd(marketingFaqItems.slice(0, 6)),
    ],
  };

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto grid min-h-[92svh] max-w-6xl content-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-200">
              Property management software
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Run rental property work from one organized desk.
            </h1>
            <p className="mt-5 text-base leading-8 text-neutral-300 sm:text-lg">
              EstateDesk helps property managers and landlords manage tenants,
              leases, rent, water bills, vacancies, maintenance, reports, and
              staff access without scattered spreadsheets and message threads.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-neutral-950"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/vacancies"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-semibold text-white"
              >
                View vacancies
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              return (
                <article
                  key={workflow.title}
                  className="rounded-2xl border border-white/15 bg-white/[0.08] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white/10 p-2">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        {workflow.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-neutral-300">
                        {workflow.body}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {proofPoints.map((point) => (
            <div
              key={point}
              className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm leading-6 text-neutral-700">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50 py-10 sm:py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Built for mobile property operations.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-600">
              Teams can work from phones, tablets, or desktops while records stay
              tied to the right property, unit, tenant, and staff role.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white"
          >
            Compare plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <PublicAccessFooter />
    </main>
  );
}
