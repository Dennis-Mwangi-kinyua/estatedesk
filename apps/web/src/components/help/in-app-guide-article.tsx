import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Clock3 } from "lucide-react";
import type { HelpWorkspace } from "@/lib/help/help-workspace";
import { getInAppHelpArticlePath, getInAppHelpHubPath } from "@/lib/help/help-workspace";
import type { GuideArticle } from "@/lib/guides/types";

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function InAppGuideArticle({
  guide,
  workspace,
  relatedGuides,
}: {
  guide: GuideArticle;
  workspace: HelpWorkspace;
  relatedGuides: GuideArticle[];
}) {
  const hubPath = getInAppHelpHubPath(workspace);

  const isOrg = workspace === "org";
  const pageClassName = isOrg
    ? "mx-auto w-full max-w-4xl space-y-8"
    : "ed-theme-page mx-auto w-full max-w-4xl space-y-8 px-3 py-4 sm:px-5 sm:py-6 lg:px-0";
  const cardClassName = isOrg
    ? "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm p-5 sm:p-6"
    : "ed-theme-card rounded-[28px] border p-5 sm:p-6";
  const sectionCardClassName = isOrg
    ? "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm p-5 sm:p-6"
    : "ed-theme-card rounded-[24px] border p-5 sm:p-6";

  return (
    <div className={pageClassName}>
      <section className={cardClassName}>
        <Link
          href={hubPath}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back to workspace help
        </Link>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          {guide.category}
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {guide.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
          {guide.summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatPublishedDate(guide.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <Clock3 className="h-4 w-4" />
            {guide.readingMinutes} min read
          </span>
        </div>
      </section>

      <section className="space-y-8">
        {guide.sections.map((section) => (
          <article key={section.heading} className={sectionCardClassName}>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {section.heading}
            </h2>
            <div className="mt-4 grid gap-4 text-sm leading-7 text-muted-foreground sm:text-base">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className={sectionCardClassName}>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Key takeaways
        </h2>
        <ul className="mt-4 grid gap-3">
          {guide.takeaways.map((takeaway) => (
            <li
              key={takeaway}
              className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm leading-7 text-foreground"
            >
              {takeaway}
            </li>
          ))}
        </ul>
      </section>

      {guide.faq.length > 0 ? (
        <section className={sectionCardClassName}>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Questions about this workflow
          </h2>
          <div className="mt-4 grid gap-3">
            {guide.faq.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-border bg-card p-4"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-foreground sm:text-base">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {relatedGuides.length > 0 ? (
        <section className={sectionCardClassName}>
          <h2 className="text-base font-semibold text-foreground">Related guides</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedGuides.map((related) => (
              <Link
                key={related.slug}
                href={getInAppHelpArticlePath(workspace, related.slug)}
                className="rounded-2xl border border-border bg-card p-4 transition hover:bg-muted/50"
              >
                <p className="text-sm font-semibold text-foreground">{related.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {related.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}