import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Clock3, Layers3 } from "lucide-react";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { faqJsonLd } from "@/components/marketing/seo-faq";
import {
  getGuideHubPath,
  getGuidePath,
  getRelatedGuides,
} from "@/lib/guides";
import type { GuideArticle } from "@/lib/guides/types";
import { absoluteUrl } from "@/lib/seo";
import { serializeJsonForHtml } from "@/lib/security/safe-json";

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function GuideArticlePage({ guide }: { guide: GuideArticle }) {
  const path = getGuidePath(guide.slug);
  const relatedGuides = getRelatedGuides([...guide.relatedGuideSlugs]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${absoluteUrl(path)}#article`,
        headline: guide.title,
        description: guide.summary,
        datePublished: guide.publishedAt,
        dateModified: guide.publishedAt,
        author: {
          "@type": "Organization",
          name: "EstateDesk",
          url: absoluteUrl("/"),
        },
        publisher: {
          "@type": "Organization",
          name: "EstateDesk",
          url: absoluteUrl("/"),
        },
        mainEntityOfPage: absoluteUrl(path),
        keywords: guide.keywords.join(", "),
        articleSection: guide.category,
        timeRequired: `PT${guide.readingMinutes}M`,
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
          {
            "@type": "ListItem",
            position: 3,
            name: guide.title,
            item: absoluteUrl(path),
          },
        ],
      },
      faqJsonLd(guide.faq),
    ],
  };

  return (
    <main className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(jsonLd) }}
      />
      <PublicAccessHeader active="guides" />

      <section className="border-b border-neutral-200 bg-white dark:border-white/10 dark:bg-[#0b0f16]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href={getGuideHubPath()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-950 dark:text-[#d1d5db] dark:hover:text-[#f8fafc]"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to guides
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
            <BookOpen className="h-3.5 w-3.5" />
            {guide.category}
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-4xl lg:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-neutral-600 dark:text-[#d1d5db] sm:text-lg">
            {guide.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-[#d1d5db]">
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#fbfcfe] px-3 py-1.5 dark:border-white/12 dark:bg-white/[0.07]">
              <CalendarDays className="h-4 w-4" />
              {formatPublishedDate(guide.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#fbfcfe] px-3 py-1.5 dark:border-white/12 dark:bg-white/[0.07]">
              <Clock3 className="h-4 w-4" />
              {guide.readingMinutes} min read
            </span>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 dark:bg-[#0f1319] sm:py-12 lg:py-14">
        <div className="mx-auto max-w-4xl space-y-10 px-4 sm:px-6 lg:px-8">
          {guide.sections.map((section) => (
            <article key={section.heading}>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc]">
                {section.heading}
              </h2>
              <div className="mt-4 grid gap-4 text-base leading-8 text-neutral-600 dark:text-[#d1d5db]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-[#f7f9fc] py-10 dark:border-white/10 dark:bg-[#151922] sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc]">
            Key takeaways
          </h2>
          <ul className="mt-5 grid gap-3">
            {guide.takeaways.map((takeaway) => (
              <li
                key={takeaway}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-7 text-neutral-700 dark:border-white/12 dark:bg-white/[0.07] dark:text-[#e5e7eb]"
              >
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-10 dark:bg-[#0f1319] sm:py-12 lg:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc]">
            Questions about this workflow
          </h2>
          <div className="mt-6 grid gap-3">
            {guide.faq.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-neutral-200 bg-[#fbfcfe] p-5 dark:border-white/12 dark:bg-white/[0.07]"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-neutral-950 dark:text-[#f8fafc]">
                  <span className="inline-flex w-full items-start justify-between gap-4">
                    <span>{item.question}</span>
                    <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-500 dark:border-white/12 dark:bg-white/[0.10] dark:text-[#d1d5db] group-open:hidden">
                      Open
                    </span>
                    <span className="hidden shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-500 dark:border-white/12 dark:bg-white/[0.10] dark:text-[#d1d5db] group-open:inline-flex">
                      Close
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {(relatedGuides.length > 0 || guide.relatedLinks.length > 0) && (
        <section className="border-t border-neutral-200 bg-[#f7f9fc] py-10 dark:border-white/10 dark:bg-[#151922] sm:py-12 lg:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {relatedGuides.length > 0 ? (
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
                  <Layers3 className="h-3.5 w-3.5" />
                  Related guides
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {relatedGuides.map((relatedGuide) => (
                    <Link
                      key={relatedGuide.slug}
                      href={getGuidePath(relatedGuide.slug)}
                      className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.07] dark:hover:border-white/22 dark:hover:bg-white/[0.10]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-[#d1d5db]">
                            {relatedGuide.category}
                          </p>
                          <h3 className="mt-2 text-base font-semibold text-neutral-950 dark:text-[#f8fafc]">
                            {relatedGuide.title}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">
                            {relatedGuide.summary}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-500 transition group-hover:translate-x-0.5 dark:text-[#d1d5db]" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {guide.relatedLinks.length > 0 ? (
              <div className={relatedGuides.length > 0 ? "mt-8" : ""}>
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-[#f8fafc]">
                  Explore EstateDesk pages
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {guide.relatedLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 dark:border-white/12 dark:bg-white/[0.07] dark:hover:border-white/22"
                    >
                      <p className="text-sm font-semibold text-neutral-950 dark:text-[#f8fafc]">
                        {link.title}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">
                        {link.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <section className="border-t border-neutral-200 bg-white py-10 dark:border-white/10 dark:bg-[#0f1319] sm:py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc]">
            Ready to organize this workflow in EstateDesk?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-neutral-600 dark:text-[#d1d5db]">
            Start with the records your team uses every day, then layer on billing,
            caretaker coordination, vacancies, and reporting as the portfolio grows.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-black dark:bg-white dark:text-[#10141a] dark:hover:bg-[#e5e7eb]"
            >
              Start with EstateDesk
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 dark:border-white/16 dark:bg-white/[0.08] dark:text-[#f8fafc] dark:hover:bg-white/[0.14]"
            >
              Talk to the team
            </Link>
          </div>
        </div>
      </section>

      <PublicAccessFooter />
    </main>
  );
}
