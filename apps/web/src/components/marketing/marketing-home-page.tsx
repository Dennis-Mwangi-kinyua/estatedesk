import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle, Layers3, Users } from "lucide-react";
import { ContentDepthStack } from "@/components/marketing/content-depth-sections";
import OperationsShowcase from "@/components/marketing/operations-showcase";
import { siteContentDepth } from "@/lib/content-depth/site-topics";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { faqJsonLd, marketingFaqItems } from "@/components/marketing/seo-faq";
import { absoluteUrl } from "@/lib/seo";
import { serializeJsonForHtml } from "@/lib/security/safe-json";

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
  "Tenant profiles, leases, occupancy, move-out history, and tribunal-ready communication packs.",
  "M-Pesa and multi-bank rent collection with combined bills that clear utilities before rent.",
  "Water billing, offline caretaker metering, IndexedDB queues, and background sync.",
  "KRA eTIMS/eRITS-ready receipts with seller PIN, control unit, and live submit when configured.",
  "Double-entry accounting: cash position, AR/AP aging, books health, budgets, owner distributions.",
  "Public vacancy SEO pages for houses, apartments, bedsitters, shops, and offices.",
  "WhatsApp Business intents for balance, bill, pay, and receipt links.",
  "Role-aware access for admins, managers, accountants, caretakers, staff, and tenants.",
  "PWA install, free Web Push alerts, and mobile-first dashboards for field and office teams.",
];

const homepageFaqItems = marketingFaqItems.slice(0, 8);
const seoHubLinks = [
  ["Property management software Kenya", "/property-management-software-kenya"],
  ["Property management software Dubai", "/property-management-software-dubai"],
  ["Landlord software", "/landlord-software"],
  ["Rent tracking software", "/rent-tracking-software"],
  ["Water billing software", "/water-billing-software"],
  ["Vacant houses", "/vacancies"],
  ["Bedsitters in Nairobi", "/vacancies/nairobi/bedsitters"],
  ["Apartments in Ruaka", "/vacancies/ruaka/apartments"],
  ["Shops in Thika", "/vacancies/thika/shops"],
  ["Single rooms in Rongai", "/vacancies/rongai/single-rooms"],
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
    <main className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(jsonLd) }}
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
      <section className="border-y border-neutral-200 bg-[#f7f9fc] py-8 sm:py-10 lg:py-12 dark:border-white/10 dark:bg-[#0d1117]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-slate-300"
          >
            <Link href="/" className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-neutral-700 transition hover:border-neutral-300 dark:border-white/12 dark:bg-white/[0.07] dark:text-slate-100">
              Home
            </Link>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 dark:border-white/12 dark:bg-white/[0.07]">
              Property management software
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-200">
              EstateDesk overview
            </span>
          </nav>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.45fr)] lg:items-start">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/12 dark:bg-white/[0.07] dark:text-slate-200">
                <Layers3 className="h-3.5 w-3.5" />
                Property management software
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-3xl dark:text-slate-50">
                What EstateDesk does — and why it wins
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base dark:text-slate-300">
                EstateDesk is Kenya-built property management software: M-Pesa rent
                collection, water billing, offline caretaker metering, double-entry
                accounting, KRA eTIMS-ready receipts, WhatsApp ops, public vacancy SEO,
                and role-based staff access. It replaces spreadsheets, notebooks, and
                generic foreign PMS tools that ignore how Kenyan rentals actually run.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  [
                    "Kenya-first payments & tax",
                    "M-Pesa, multi-bank rails, service-before-rent allocation, and KRA eTIMS/eRITS-ready receipts on verified payments.",
                  ],
                  [
                    "Field + office in one system",
                    "Offline meter queues, SLAs, inspections, unit QR, accounting, and vacancies—not three disconnected apps.",
                  ],
                  [
                    "Ranks & operates",
                    "Public vacancy pages that tenants find on Google, plus private dashboards for managers, accountants, and caretakers.",
                  ],
                ].map(([title, body]) => (
                  <article
                    key={title}
                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/12 dark:bg-[#121821]"
                  >
                    <h3 className="text-sm font-semibold text-neutral-950 dark:text-slate-50">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-slate-300">{body}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/12 dark:bg-[#121821]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-slate-300">
                Quick paths
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
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
                    className="inline-flex min-h-10 min-w-0 items-center gap-2 rounded-lg border border-neutral-200 bg-[#fbfcfe] px-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-white dark:border-white/12 dark:bg-white/[0.07] dark:text-slate-100 dark:hover:border-white/24 dark:hover:bg-white/[0.12]"
                  >
                    <span className="truncate">{label}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                ))}
              </div>
            </aside>
          </div>
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

      <section className="ed-theme-band-inverse border-y border-white/10 py-10 sm:py-12 lg:py-14">
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

      <section className="border-y border-neutral-200 bg-[#f7f9fc] py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                Browse EstateDesk by search intent
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600">
                Fast paths for landlords, property managers, tenants, and local rental searches.
              </p>
            </div>
            <Link href="/faq" className="text-sm font-semibold text-neutral-700 hover:text-neutral-950">
              Full FAQ
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {seoHubLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 hover:bg-[#fbfcfe]"
              >
                {label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
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

      <ContentDepthStack {...siteContentDepth} />

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
