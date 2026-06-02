import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle, Layers3, Users } from "lucide-react";
import OperationsShowcase from "@/components/marketing/operations-showcase";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { faqJsonLd, marketingFaqItems } from "@/components/marketing/seo-faq";
import { absoluteUrl } from "@/lib/seo";

const homepageAudiences = [
  {
    title: "Property managers",
    body: "EstateDesk helps property managers coordinate buildings, units, tenants, rent balances, water bills, caretakers, maintenance issues, inspections, vacancies, reports, and staff access from one online workspace.",
  },
  {
    title: "Landlords",
    body: "Landlords use EstateDesk to see what is happening in their rental portfolio without waiting for scattered updates. They can review occupancy, tenant records, balances, issues, vacant units, and property activity online.",
  },
  {
    title: "Real estate agencies",
    body: "Agencies use EstateDesk to create a repeatable property management process for clients, staff, caretakers, accountants, and tenants while keeping records searchable and easier to report.",
  },
  {
    title: "Tenants",
    body: "Tenants benefit from clearer records, public vacancy discovery, maintenance request workflows, notices, billing visibility, and better communication with the managing office.",
  },
];

const homepageFeatures = [
  "Tenant profiles, lease records, occupancy tracking, and move-out history.",
  "Rent tracking, tenant balances, paid and unpaid tenant visibility, and payment verification workflows.",
  "Water billing workflows for readings, tenant charges, balances, and billing history.",
  "Public vacancy pages for available homes, apartments, bedsitters, shops, offices, and mixed-use spaces.",
  "Maintenance issue tracking, caretaker coordination, inspections, and printable records.",
  "Role-aware access for admins, managers, accountants, caretakers, staff, and tenants.",
  "Reports for occupancy, payments, balances, issues, inspections, and operational activity.",
  "Mobile-friendly access through modern browsers for office, field, and remote teams.",
];

const homepageFaqItems = marketingFaqItems.slice(0, 8);

export default function MarketingHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl("/")}#organization`,
        name: "EstateDesk",
        url: absoluteUrl("/"),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          url: absoluteUrl("/contact"),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl("/")}#website`,
        name: "EstateDesk",
        url: absoluteUrl("/"),
        publisher: {
          "@id": `${absoluteUrl("/")}#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/vacancies")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl("/")}#sitelinks`,
        name: "EstateDesk site links",
        itemListElement: [
          { "@type": "SiteNavigationElement", position: 1, name: "Login", url: absoluteUrl("/login") },
          { "@type": "SiteNavigationElement", position: 2, name: "Vacancies", url: absoluteUrl("/vacancies") },
          { "@type": "SiteNavigationElement", position: 3, name: "EstateDesk System", url: absoluteUrl("/services") },
          { "@type": "SiteNavigationElement", position: 4, name: "Sign Up", url: absoluteUrl("/register") },
          { "@type": "SiteNavigationElement", position: 5, name: "Pricing", url: absoluteUrl("/pricing") },
          { "@type": "SiteNavigationElement", position: 6, name: "Help", url: absoluteUrl("/contact") },
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${absoluteUrl("/")}#software`,
        name: "EstateDesk",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: absoluteUrl("/"),
        description:
          "Property management software for Kenya covering tenants, leases, rent, water bills, caretakers, inspections, maintenance issues, and team access.",
        areaServed: {
          "@type": "Country",
          name: "Kenya",
        },
        offers: {
          "@type": "Offer",
          category: "SaaS subscription",
          priceCurrency: "KES",
          url: absoluteUrl("/pricing"),
        },
        publisher: {
          "@id": `${absoluteUrl("/")}#organization`,
        },
      },
      faqJsonLd(homepageFaqItems),
    ],
  };

  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OperationsShowcase
        standalone
        publicHeaderActive="home"
        showPricingNav={false}
        showFooter={false}
        variant="rentals"
      />
      <HomepageSeoContent />
      <PublicAccessFooter />
    </main>
  );
}

function HomepageSeoContent() {
  return (
    <>
      <section className="border-y border-neutral-200 bg-[#f7f9fc] py-10 sm:py-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
              <Layers3 className="h-3.5 w-3.5" />
              Property management software
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              What is EstateDesk?
            </h2>
            <div className="mt-4 grid gap-4 text-base leading-8 text-neutral-600">
              <p>
                EstateDesk is property management software for landlords, property managers,
                real estate agencies, caretakers, and tenants. It gives a rental team one
                organized online workspace for the daily work of managing property: tenants,
                leases, rent records, water bills, vacancies, maintenance requests,
                inspections, staff access, notifications, and reports. Instead of keeping
                important information across notebooks, spreadsheets, message threads,
                receipts, and staff memory, EstateDesk connects the record to the correct
                property, unit, tenant, and workflow.
              </p>
              <p>
                The platform is especially focused on rental operations in Kenya, East
                Africa, Dubai, the UAE, and remote landlord markets where property owners
                need visibility without being physically present every day. A landlord can
                review vacant units, balances, maintenance activity, and tenant records. A
                property manager can follow rent, water billing, caretaker tasks, inspections,
                and move-outs. A real estate agency can manage multiple clients with clearer
                staff roles and reports. Tenants can find public vacancies and use structured
                workflows for communication and maintenance.
              </p>
              <p>
                EstateDesk is not only a database of property records. It is an operating
                system for rental work. The goal is to make every action easier to trace:
                who occupies a unit, what rent is expected, whether payment has been
                recorded, what water bill was charged, which issue is pending, which unit is
                vacant, and which staff member is responsible for follow-up. That structure
                helps teams reduce confusion, improve accountability, and build a more
                professional rental management process.
              </p>
            </div>
          </div>

          <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Quick paths
            </p>
            <div className="mt-4 grid gap-3">
              {[
                ["Kenya software", "/property-management-software-kenya"],
                ["Landlord software", "/landlord-software"],
                ["Rent tracking", "/rent-tracking-software"],
                ["Water billing", "/water-billing-software"],
                ["Full FAQ", "/faq"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex min-h-11 items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-[#fbfcfe] px-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-white"
                >
                  {label}
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
            <Users className="h-3.5 w-3.5" />
            Who uses EstateDesk?
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-3xl">
            Built for the people involved in rental management
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {homepageAudiences.map((audience) => (
              <article key={audience.title} className="rounded-2xl border border-neutral-200 bg-[#fbfcfe] p-5">
                <h3 className="text-base font-semibold text-neutral-950">{audience.title}</h3>
                <p className="mt-2 text-sm leading-7 text-neutral-600">{audience.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#10141a] py-10 text-[#f8fafc] sm:py-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d1d5db]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Features and benefits
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Key features that make property work easier to manage
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#d1d5db]">
              EstateDesk brings the most important rental operations into one workflow so
              teams can act faster, search records more easily, and reduce manual follow-up.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {homepageFeatures.map((feature) => (
              <div key={feature} className="flex gap-3 rounded-2xl border border-white/14 bg-white/[0.08] p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-sm leading-7 text-[#e5e7eb]">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              How EstateDesk works
            </h2>
            <div className="mt-5 grid gap-4 text-base leading-8 text-neutral-600">
              <p>
                First, the team creates the property structure: properties, buildings,
                units, rent amounts, and occupancy details. Then tenant profiles and lease
                records are connected to the correct units. From there, the office can
                manage rent tracking, water billing, maintenance requests, move-outs,
                inspections, vacancies, reports, and staff access inside the same system.
              </p>
              <p>
                The benefit is simple: daily property decisions become easier because the
                team can search and act from the same source of truth. A manager can see
                unpaid rent and open issues. A caretaker can follow assigned work. A tenant
                can discover available vacancies or submit requests through the right
                channel. A landlord can review performance without waiting for manual
                summaries. EstateDesk helps rental teams move from scattered records to a
                clearer, more accountable operating rhythm.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-[#f7f9fc] p-5">
            <h3 className="text-lg font-semibold text-neutral-950">Ready to organize your portfolio?</h3>
            <p className="mt-2 text-sm leading-7 text-neutral-600">
              Start with the Free plan, compare Pro and Plus pricing, or speak with the
              team about a Custom rollout for a larger property management operation.
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-black dark:bg-white dark:text-[#10141a] dark:hover:bg-[#e5e7eb]"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-[#f7f9fc] py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
            <HelpCircle className="h-3.5 w-3.5" />
            Short FAQ
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-3xl">
            Common questions about EstateDesk
          </h2>
          <div className="mt-7 grid gap-3">
            {homepageFaqItems.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-neutral-200 bg-white p-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-neutral-950">
                  <span className="inline-flex w-full items-start justify-between gap-4">
                    <span>{item.question}</span>
                    <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-500 group-open:hidden">
                      Open
                    </span>
                    <span className="hidden shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-500 group-open:inline-flex">
                      Close
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{item.answer}</p>
              </details>
            ))}
          </div>
          <Link
            href="/faq"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-black dark:bg-white dark:text-[#10141a] dark:hover:bg-[#e5e7eb]"
          >
            Read the full FAQ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
