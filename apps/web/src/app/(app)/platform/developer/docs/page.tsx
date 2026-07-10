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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Private documentation"
        title="System documentation"
        description="In-depth operator and engineering reference for how EstateDesk works end-to-end. Visible only to platform admins and super admins — never public, never sitemapped."
        action={
          <Link
            href="/platform/developer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/40"
          >
            Back to Developer Home
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/90 px-4 py-3 text-sm text-foreground/80 shadow-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <Lock className="h-3.5 w-3.5" />
          Platform-private
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground/65">
          <Shield className="h-3.5 w-3.5" />
          {articles.length} deep articles · ~
          {articles.reduce((sum, a) => sum + a.readingMinutes, 0)} min total ·
          noindex · not in public /guides
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-20">
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

        <div className="space-y-6">
          {categories.map(({ category, articles: group }) => (
            <section key={category} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/60">
                {category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.map((article) => (
                  <Link
                    key={article.slug}
                    id={article.slug}
                    href={`/platform/developer/docs/${article.slug}`}
                    className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-violet-400/50 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-violet-700 dark:text-violet-300">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-300">
                          {article.title}
                        </p>
                        <p className="mt-1.5 text-sm leading-6 text-foreground/70">
                          {article.summary}
                        </p>
                        <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                          Read article
                          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          <span className="ml-2 font-normal text-foreground/50">
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
