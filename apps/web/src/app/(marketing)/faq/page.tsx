import Link from "next/link";
import { ArrowRight, HelpCircle, Search } from "lucide-react";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { ContentDepthStack } from "@/components/marketing/content-depth-sections";
import {
  faqJsonLd,
  marketingFaqItems,
  pricingFaqItems,
  regionalFaqItems,
  searchIntentFaqItems,
} from "@/components/marketing/seo-faq";
import { guideTopicLink, sharedWorkflowScenarios } from "@/lib/content-depth/site-topics";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Property Management Software FAQ for Kenya, East Africa and Dubai",
  description:
    "Detailed EstateDesk FAQ for landlords and property managers in Kenya, East Africa, Dubai, and global rental markets: tenant records, rent tracking, water billing, vacancies, caretakers, inspections, reports, pricing, and searchable property operations.",
  path: "/faq",
  keywords: [
    "EstateDesk FAQ",
    "property management software FAQ Kenya",
    "landlord software questions Kenya",
    "tenant management system FAQ",
    "rent management software FAQ",
    "water billing software questions Kenya",
    "caretaker management software Kenya",
    "vacant houses system Kenya",
    "property management software East Africa FAQ",
    "property management software Dubai FAQ",
    "property management software UAE FAQ",
    "diaspora landlord property management software",
    "remote landlord software",
    "best property management software Kenya",
    "Excel alternative for landlords",
    "unpaid rent tracking software",
    "property maintenance software Kenya",
    "cloud property management software",
  ],
});

const faqSections = [
  {
    title: "Using EstateDesk",
    description: "Product, operations, tenant, billing, and team access questions.",
    items: marketingFaqItems,
  },
  {
    title: "Regions and remote management",
    description: "Worldwide, East Africa, Dubai, UAE, and diaspora landlord questions.",
    items: regionalFaqItems,
  },
  {
    title: "Search questions landlords ask",
    description: "High-intent questions about software, rent, vacancies, and remote work.",
    items: searchIntentFaqItems,
  },
  {
    title: "Plans and pricing",
    description: "What is included in Free, Pro, Plus, and Custom.",
    items: pricingFaqItems,
  },
] as const;

export default function FaqPage() {
  const allItems = faqSections.flatMap((section) => section.items);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${absoluteUrl("/faq")}#webpage`,
        name: "EstateDesk property management software FAQ for Kenya, East Africa and Dubai",
        url: absoluteUrl("/faq"),
        description:
          "Detailed answers about EstateDesk property management software for landlords, property managers, caretakers, tenants, pricing, rent tracking, water billing, vacancies, inspections, and reports across Kenya, East Africa, Dubai, UAE, and global rental markets.",
        isPartOf: {
          "@type": "WebSite",
          name: "EstateDesk",
          url: absoluteUrl("/"),
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${absoluteUrl("/faq")}#software`,
        name: "EstateDesk",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: absoluteUrl("/"),
        description:
          "Cloud property management software for landlords, property managers, caretakers, tenants, real estate teams, and remote property owners.",
        areaServed: [
          { "@type": "Country", name: "Kenya" },
          { "@type": "Country", name: "Uganda" },
          { "@type": "Country", name: "Tanzania" },
          { "@type": "Country", name: "Rwanda" },
          { "@type": "Country", name: "United Arab Emirates" },
        ],
        audience: [
          { "@type": "Audience", audienceType: "Landlords" },
          { "@type": "Audience", audienceType: "Property managers" },
          { "@type": "Audience", audienceType: "Real estate agencies" },
          { "@type": "Audience", audienceType: "Caretakers" },
          { "@type": "Audience", audienceType: "Diaspora landlords" },
        ],
        offers: [
          { "@type": "Offer", name: "Free", price: "0", priceCurrency: "KES" },
          { "@type": "Offer", name: "Pro", price: "3000", priceCurrency: "KES" },
          { "@type": "Offer", name: "Plus", price: "6500", priceCurrency: "KES" },
          { "@type": "Offer", name: "Custom", price: "0", priceCurrency: "KES" },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "FAQ",
            item: absoluteUrl("/faq"),
          },
        ],
      },
      faqJsonLd(allItems),
    ],
  };

  return (
    <main className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicAccessHeader active="faq" />

      <section className="border-b border-neutral-200 bg-white dark:border-white/10 dark:bg-[#0b0f16]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:px-8 lg:py-16">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
              <HelpCircle className="h-3.5 w-3.5" />
              EstateDesk help
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
              EstateDesk property management software FAQ for Kenya, East Africa and Dubai
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
              Detailed answers for landlords, property managers, caretakers,
              tenants, diaspora landlords, and real estate teams comparing
              property management software in Kenya, East Africa, Dubai, the
              UAE, and other rental markets. Learn how EstateDesk handles rent
              tracking, tenant records, water billing, vacancies, inspections,
              staff access, reports, remote management, and pricing.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-[#f8fafc] p-4">
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3">
              <Search className="h-4 w-4 shrink-0 text-neutral-400" />
              <p className="min-w-0 text-sm leading-6 text-neutral-600">
                This page is public, indexable, and included in the sitemap so
                search engines can discover these EstateDesk answers.
              </p>
            </div>
            <Link
              href="/contact"
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-black"
            >
              Contact support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="FAQ sections"
            className="grid gap-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:grid-cols-2"
          >
            {faqSections.map((section) => (
              <a
                key={section.title}
                href={`#${section.title.toLowerCase().replaceAll(" ", "-")}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-[#fbfcfe] px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-white hover:text-neutral-950"
              >
                {section.title}
              </a>
            ))}
          </nav>

          {faqSections.map((section) => (
            <section
              key={section.title}
              id={section.title.toLowerCase().replaceAll(" ", "-")}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6"
            >
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em] text-neutral-950">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {section.description}
                  </p>
                </div>

                <div className="grid gap-3">
                  {section.items.map((item) => (
                    <details
                      key={item.question}
                      className="group rounded-xl border border-neutral-200 bg-[#fbfcfe] p-4"
                    >
                      <summary className="cursor-pointer list-none text-sm font-semibold text-neutral-950 sm:text-base">
                        <span className="flex min-w-0 items-start justify-between gap-3">
                          <span className="min-w-0 text-wrap">{item.question}</span>
                          <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] text-neutral-500 group-open:hidden">
                            Open
                          </span>
                          <span className="hidden shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] text-neutral-500 group-open:inline-flex">
                            Close
                          </span>
                        </span>
                      </summary>
                      <p className="mt-3 text-sm leading-7 text-neutral-600">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </section>

      <ContentDepthStack
        scenarios={[...sharedWorkflowScenarios]}
        scenariosTitle="Workflow scenarios behind the FAQ"
        guidesTitle="Long-form guides and product paths"
        guides={[
          guideTopicLink("kenya-rental-operations"),
          guideTopicLink("rent-tracking-workflow"),
          guideTopicLink("tenant-issue-tracking"),
          {
            title: "Property management guides hub",
            href: "/guides",
            description:
              "Browse all EstateDesk workflow guides for rent, water billing, caretakers, vacancies, and move-outs.",
          },
        ]}
      />

      <PublicAccessFooter />
    </main>
  );
}
