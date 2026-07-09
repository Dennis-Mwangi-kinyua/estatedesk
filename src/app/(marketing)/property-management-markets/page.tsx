import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Building2, Globe2, SearchCheck, ShieldCheck } from "lucide-react";
import { ContentDepthStack } from "@/components/marketing/content-depth-sections";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { siteContentDepth } from "@/lib/content-depth/site-topics";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";
import { marketCoverageItems, marketCoverageKeywords } from "@/lib/seo-index";

export const metadata = publicPageMetadata({
  title: "Property Management Software Markets and Use Cases",
  description:
    "Explore EstateDesk property management software pages for Kenya, East Africa, Dubai, UAE, landlords, rent tracking, water billing, vacancies, services, and pricing.",
  path: "/property-management-markets",
  keywords: marketCoverageKeywords,
});

export default function PropertyManagementMarketsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl("/property-management-markets")}#webpage`,
        name: "EstateDesk property management markets and use cases",
        url: absoluteUrl("/property-management-markets"),
        description:
          "A public index of EstateDesk property management software pages by market, workflow, and search intent.",
        isPartOf: {
          "@type": "WebSite",
          name: "EstateDesk",
          url: absoluteUrl("/"),
        },
      },
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl("/property-management-markets")}#index`,
        name: "EstateDesk public discovery pages",
        itemListElement: marketCoverageItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          url: absoluteUrl(item.href),
          description: item.description,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "EstateDesk",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Markets and use cases",
            item: absoluteUrl("/property-management-markets"),
          },
        ],
      },
    ],
  };

  return (
    <main className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicAccessHeader active="services" />

      <section className="border-b border-neutral-200 bg-white dark:border-white/10 dark:bg-[#0f1319]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
              <SearchCheck className="h-4 w-4" />
              Public discovery index
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-4xl lg:text-5xl">
              Property management software pages by market and workflow
            </h1>
            <p className="mt-4 text-base leading-8 text-neutral-600 dark:text-[#d1d5db] sm:text-lg">
              Use this index to find the most relevant EstateDesk page for your
              portfolio: Kenya, East Africa, Dubai, UAE, landlord operations,
              rent tracking, water billing, vacancies, services, and pricing.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          {marketCoverageItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.07] dark:hover:border-white/22 dark:hover:bg-white/[0.10]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-950 dark:text-[#f8fafc]">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">
                    {item.description}
                  </p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-900 transition group-hover:border-neutral-300 dark:border-white/12 dark:bg-white/[0.08] dark:text-[#f8fafc]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.keywords.slice(0, 3).map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:border-white/12 dark:bg-white/[0.08] dark:text-[#e5e7eb]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50 py-10 dark:border-white/10 dark:bg-[#151922] sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          <IndexFact
            icon={<Globe2 className="h-4 w-4" />}
            title="Regional coverage"
            body="Kenya, East Africa, Dubai, UAE, diaspora, and remote rental operations."
          />
          <IndexFact
            icon={<Building2 className="h-4 w-4" />}
            title="Workflow coverage"
            body="Tenants, leases, rent, water bills, inspections, vacancies, staff, and reports."
          />
          <IndexFact
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Crawler-safe"
            body="Human-readable public pages, canonical URLs, sitemap inclusion, and structured data."
          />
        </div>
      </section>

      <ContentDepthStack {...siteContentDepth} />

      <PublicAccessFooter />
    </main>
  );
}

function IndexFact({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/12 dark:bg-white/[0.07]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-white/12 dark:bg-white/[0.08] dark:text-[#f8fafc]">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-semibold text-neutral-950 dark:text-[#f8fafc]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">
        {body}
      </p>
    </article>
  );
}
