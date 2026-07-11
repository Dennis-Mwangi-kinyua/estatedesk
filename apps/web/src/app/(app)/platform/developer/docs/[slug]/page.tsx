import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock3, Lock } from "lucide-react";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { privatePageMetadata } from "@/lib/seo";
import {
  getSystemDocArticles,
  getSystemDocBySlug,
} from "@/lib/platform/system-docs";

export const dynamic = "force-dynamic";
export const metadata = privatePageMetadata;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getSystemDocArticles().map((article) => ({ slug: article.slug }));
}

export default async function DeveloperSystemDocArticlePage({
  params,
}: PageProps) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const { slug } = await params;
  const article = getSystemDocBySlug(slug);
  if (!article) notFound();

  const all = getSystemDocArticles();
  const index = all.findIndex((item) => item.slug === slug);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Link
          href="/platform/developer/docs"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-foreground/70 transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          System documentation
        </Link>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <Lock className="h-3 w-3" />
          Private
        </span>
      </div>

      <section className="rounded-xl border border-border bg-card/90 p-4 shadow-sm sm:p-6 lg:p-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/65">
          <BookOpen className="h-3.5 w-3.5" />
          {article.category}
        </div>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:mt-4 sm:text-2xl lg:text-3xl">
          {article.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-foreground/75 sm:text-base">
          {article.summary}
        </p>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-foreground/55">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
          About {article.readingMinutes} minutes · {article.sections.length} sections
        </p>
        {article.sections.length > 3 ? (
          <nav className="mt-5 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
              On this page
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-foreground/75">
              {article.sections.map((section) => {
                const anchor = section.heading
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "");
                return (
                  <li key={section.heading}>
                    <a
                      href={`#${anchor}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {section.heading}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}
      </section>

      <div className="space-y-3 sm:space-y-4">
        {article.sections.map((section) => {
          const anchor = section.heading
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          return (
            <section
              key={section.heading}
              id={anchor}
              className="scroll-mt-28 rounded-xl border border-border bg-card/90 p-4 shadow-sm sm:scroll-mt-24 sm:p-6"
            >
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="mt-3 text-sm leading-7 text-foreground/80"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets?.length ? (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-7 text-foreground/80">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.code ? (
                <pre className="mt-4 max-w-full overflow-x-auto rounded-xl border border-border bg-muted/40 p-3 text-[11px] leading-6 text-foreground sm:p-4 sm:text-xs">
                  <code className="whitespace-pre">{section.code}</code>
                </pre>
              ) : null}
            </section>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between sm:gap-3">
        {prev ? (
          <Link
            href={`/platform/developer/docs/${prev.slug}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-violet-700 dark:text-violet-300 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0"
          >
            ← {prev.title.split("—")[0]?.trim()}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/platform/developer/docs/${next.slug}`}
            className="inline-flex min-h-11 items-center justify-end rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-violet-700 dark:text-violet-300 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-right"
          >
            {next.title.split("—")[0]?.trim()} →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
