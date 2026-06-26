import Link from "next/link";
import { ArrowRight, Download, ShieldCheck } from "lucide-react";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";

type TrustSection = {
  title: string;
  body: string[];
};

type TrustPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  sections: TrustSection[];
  downloadHref?: string;
};

export function TrustPage({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
  downloadHref,
}: TrustPageProps) {
  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-[#0b0f16] dark:text-slate-100">
      <PublicAccessHeader />
      <section className="border-b border-slate-200 bg-slate-50 py-10 dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
            {eyebrow}
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
            {description}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Last updated: {updatedAt}
            </p>
            {downloadHref ? (
              <Link
                href={downloadHref}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:px-6 lg:px-8">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <h2 className="text-xl font-semibold tracking-[-0.01em] text-slate-950 dark:text-white">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
            <h2 className="text-lg font-semibold">Questions about trust and data?</h2>
            <p className="mt-2 text-sm leading-7">
              Contact EstateDesk for privacy, security, onboarding, or data handling
              questions before deploying the system in a production organization.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Contact EstateDesk
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <PublicAccessFooter />
    </main>
  );
}
