import Link from "next/link";
import { ArrowRight, BookOpen, Layers3 } from "lucide-react";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import {
  getPublicGuides,
  getGuideHubPath,
  getGuidePath,
  guideCategories,
} from "@/lib/guides";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Property Management Guides",
  description:
    "Long-form EstateDesk guides on rent tracking, water billing, caretaker workflows, tenant issues, vacancy marketing, diaspora landlords, move-outs, and rental operations in Kenya and beyond.",
  path: "/guides",
  keywords: [
    "property management guides",
    "rent tracking guide",
    "water billing guide Kenya",
    "caretaker workflow guide",
    "tenant maintenance guide",
    "vacancy marketing guide",
    "diaspora landlord guide",
    "move-out checklist rental",
    "Kenya rental operations guide",
  ],
});

export default function GuidesHubPage() {
  const guides = getPublicGuides();
  const guidesByCategory = guideCategories.map((category) => ({
    category,
    guides: guides.filter((guide) => guide.category === category),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(getGuideHubPath())}#webpage`,
        name: "EstateDesk property management guides",
        url: absoluteUrl(getGuideHubPath()),
        description:
          "Long-form EstateDesk guides on rent tracking, water billing, caretaker workflows, tenant issues, vacancy marketing, diaspora landlords, move-outs, and rental operations.",
        isPartOf: {
          "@type": "WebSite",
          name: "EstateDesk",
          url: absoluteUrl("/"),
        },
      },
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl(getGuideHubPath())}#guides`,
        name: "EstateDesk property management guides",
        itemListElement: guides.map((guide, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: guide.title,
          url: absoluteUrl(getGuidePath(guide.slug)),
          description: guide.summary,
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
            name: "Guides",
            item: absoluteUrl(getGuideHubPath()),
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
      <PublicAccessHeader active="guides" />

      <section className="border-b border-neutral-200 bg-white dark:border-white/10 dark:bg-[#0b0f16]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
              <BookOpen className="h-3.5 w-3.5" />
              Guides
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-4xl lg:text-5xl">
              Property management guides for real rental workflows
            </h1>
            <p className="mt-4 text-base leading-8 text-neutral-600 dark:text-[#d1d5db] sm:text-lg">
              Practical EstateDesk guides for rent tracking, water billing, caretaker
              coordination, tenant issues, vacancy marketing, remote landlords,
              move-outs, and Kenyan rental operations.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fc] py-10 dark:bg-[#151922] sm:py-12 lg:py-14">
        <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
          {guidesByCategory.map(({ category, guides: categoryGuides }) => (
            <div key={category}>
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
                <Layers3 className="h-3.5 w-3.5" />
                {category}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {categoryGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={getGuidePath(guide.slug)}
                    className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.07] dark:hover:border-white/22 dark:hover:bg-white/[0.10]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-neutral-950 dark:text-[#f8fafc]">
                          {guide.title}
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">
                          {guide.summary}
                        </p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-[#d1d5db]">
                          {guide.readingMinutes} min read
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-500 transition group-hover:translate-x-0.5 dark:text-[#d1d5db]" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-10 dark:border-white/10 dark:bg-[#0f1319] sm:py-12">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc]">
            Need a shorter overview first?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-neutral-600 dark:text-[#d1d5db]">
            Browse market pages, services, FAQ, and pricing if you want a faster
            product overview before reading the full workflow guides.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/property-management-markets"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-black dark:bg-white dark:text-[#10141a] dark:hover:bg-[#e5e7eb]"
            >
              Browse markets and use cases
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 dark:border-white/16 dark:bg-white/[0.08] dark:text-[#f8fafc] dark:hover:bg-white/[0.14]"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>

      <PublicAccessFooter />
    </main>
  );
}