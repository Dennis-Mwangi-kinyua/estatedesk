import Link from "next/link";
import { ArrowRight, BookOpen, Lock, Shield } from "lucide-react";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { privatePageMetadata } from "@/lib/seo";
import {
  getSystemDocArticles,
  getSystemDocCategories,
} from "@/lib/platform/system-docs";
import { PageHeader } from "../../_components/control-plane";

export const dynamic = "force-dynamic";
export const metadata = privatePageMetadata;

export default async function DeveloperSystemDocsHubPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const categories = getSystemDocCategories();
  const articles = getSystemDocArticles();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Private documentation"
        title="System documentation"
        description="In-depth operator and engineering reference for how EstateDesk works end-to-end. Visible only to platform admins and super admins — never public, never sitemapped."
        action={
          <Link
            href="/platform/developer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/40"
          >
            Back to Developer Home
          </Link>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/90 px-3 py-3 text-sm text-foreground/80 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:px-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <Lock className="h-3.5 w-3.5" />
          Platform-private
        </span>
        <span className="inline-flex items-start gap-1.5 text-xs leading-5 text-foreground/65 sm:items-center">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
          {articles.length} deep articles · ~
          {articles.reduce((sum, a) => sum + a.readingMinutes, 0)} min total ·
          noindex · not in public /guides
        </span>
      </div>

      {/* Mobile: horizontal jump chips (avoid long left rail first) */}
      <nav
        aria-label="Documentation articles"
        className="lg:hidden"
      >
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
          Jump to article
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {articles.map((article) => (
            <a
              key={article.slug}
              href={`#${article.slug}`}
              className="inline-flex shrink-0 items-center rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground/80 shadow-sm transition hover:border-violet-400/50 hover:text-foreground"
            >
              {article.title.split("—")[0]?.trim() || article.title}
            </a>
          ))}
        </div>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="hidden h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-4 lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
            On this hub
          </p>
          <ul className="mt-3 space-y-1">
            {articles.map((article) => (
              <li key={article.slug}>
                <a
                  href={`#${article.slug}`}
                  className="block rounded-lg px-2 py-1.5 text-sm text-foreground/75 transition hover:bg-muted/40 hover:text-foreground"
                >
                  {article.title.split("—")[0]?.trim() || article.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          {categories.map(({ category, articles: group }) => (
            <section key={category} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/60">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.map((article) => (
                  <Link
                    key={article.slug}
                    id={article.slug}
                    href={`/platform/developer/docs/${article.slug}`}
                    className="group scroll-mt-28 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-violet-400/50 hover:shadow-md active:scale-[0.99] sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-violet-700 dark:text-violet-300">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold leading-6 text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-300">
                          {article.title}
                        </p>
                        <p className="mt-1.5 text-sm leading-6 text-foreground/70">
                          {article.summary}
                        </p>
                        <p className="mt-3 inline-flex flex-wrap items-center gap-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                          Read article
                          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          <span className="ml-1 font-normal text-foreground/50">
                            ~{article.readingMinutes} min
                          </span>
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
