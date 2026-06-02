import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle, Layers3, ListChecks } from "lucide-react";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { type FaqItem, faqJsonLd } from "@/components/marketing/seo-faq";
import { absoluteUrl } from "@/lib/seo";

export type SeoLandingPageContent = {
  path: string;
  eyebrow: string;
  title: string;
  summary: string;
  intro: string[];
  audienceTitle: string;
  audiences: { title: string; body: string }[];
  featureTitle: string;
  features: { title: string; body: string }[];
  benefitsTitle: string;
  benefits: string[];
  howItWorksTitle: string;
  howItWorks: { title: string; body: string }[];
  faq: readonly FaqItem[];
  ctaTitle: string;
  ctaBody: string;
  serviceType: string;
};

export function SeoLandingPage({ content }: { content: SeoLandingPageContent }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${absoluteUrl(content.path)}#webpage`,
        name: content.title,
        url: absoluteUrl(content.path),
        description: content.summary,
        isPartOf: {
          "@type": "WebSite",
          name: "EstateDesk",
          url: absoluteUrl("/"),
        },
      },
      {
        "@type": "Service",
        "@id": `${absoluteUrl(content.path)}#service`,
        name: content.title,
        serviceType: content.serviceType,
        url: absoluteUrl(content.path),
        provider: {
          "@type": "Organization",
          name: "EstateDesk",
          url: absoluteUrl("/"),
        },
        areaServed: [
          { "@type": "Country", name: "Kenya" },
          { "@type": "Country", name: "Uganda" },
          { "@type": "Country", name: "Tanzania" },
          { "@type": "Country", name: "Rwanda" },
          { "@type": "Country", name: "United Arab Emirates" },
        ],
        description: content.summary,
      },
      faqJsonLd(content.faq),
    ],
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-neutral-950 dark:bg-[#0f1319] dark:text-[#f8fafc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicAccessHeader active="services" />

      <section className="border-b border-neutral-200 bg-white dark:border-white/10 dark:bg-[#0b0f16]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:px-8 lg:py-16">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
              <Layers3 className="h-3.5 w-3.5" />
              {content.eyebrow}
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-4xl lg:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-600 dark:text-[#d1d5db] sm:text-lg sm:leading-8">
              {content.summary}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-[#fbfcfe] p-4 shadow-sm dark:border-white/14 dark:bg-white/[0.07]">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-[#e5e7eb]">
              Built for
            </p>
            <div className="mt-4 grid gap-3">
              {content.audiences.slice(0, 4).map((audience) => (
                <div key={audience.title} className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-white/12 dark:bg-white/[0.08]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-neutral-700 dark:text-[#f3f4f6]">{audience.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 dark:bg-[#0f1319] sm:py-12 lg:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 text-base leading-8 text-neutral-600 dark:text-[#d1d5db]">
            {content.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-[#f7f9fc] py-10 dark:border-white/10 dark:bg-[#151922] sm:py-12 lg:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-3xl">
            {content.audienceTitle}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {content.audiences.map((item) => (
              <article key={item.title} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/12 dark:bg-white/[0.07]">
                <h3 className="text-base font-semibold text-neutral-950 dark:text-[#f8fafc]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10 dark:bg-[#0f1319] sm:py-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
              <ListChecks className="h-3.5 w-3.5" />
              Features
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-3xl">
              {content.featureTitle}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {content.features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-neutral-200 bg-[#fbfcfe] p-5 dark:border-white/12 dark:bg-white/[0.07]">
                <h3 className="text-base font-semibold text-neutral-950 dark:text-[#f8fafc]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#10141a] py-10 text-[#f8fafc] sm:py-12 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {content.benefitsTitle}
            </h2>
            <div className="mt-6 grid gap-3">
              {content.benefits.map((benefit) => (
                <div key={benefit} className="flex gap-3 rounded-2xl border border-white/14 bg-white/[0.08] p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-7 text-[#e5e7eb]">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="seo-steps-panel rounded-2xl p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
            <h3 className="seo-steps-heading text-lg font-semibold">{content.howItWorksTitle}</h3>
            <div className="mt-5 grid gap-3">
              {content.howItWorks.map((step, index) => (
                <div
                  key={step.title}
                  className="seo-step-card flex gap-4 rounded-2xl p-4"
                >
                  <span className="seo-step-number flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="seo-step-title text-sm font-semibold">{step.title}</p>
                    <p className="seo-step-body mt-1 text-sm leading-7">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 dark:bg-[#0f1319] sm:py-12 lg:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
            <HelpCircle className="h-3.5 w-3.5" />
            FAQ
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-3xl">
            Questions about {content.serviceType.toLowerCase()}
          </h2>
          <div className="mt-7 grid gap-3">
            {content.faq.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-neutral-200 bg-[#fbfcfe] p-5 dark:border-white/12 dark:bg-white/[0.07]">
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
                <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-[#f7f9fc] py-10 dark:border-white/10 dark:bg-[#151922] sm:py-12 lg:py-14">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-3xl">
            {content.ctaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-neutral-600 dark:text-[#d1d5db]">
            {content.ctaBody}
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
