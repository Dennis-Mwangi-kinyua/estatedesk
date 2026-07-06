import Link from "next/link";
import { ArrowRight, BookOpen, CircleHelp, Layers3, Workflow } from "lucide-react";
import type { ContentDepthSections } from "@/lib/content-depth/types";

type ContentDepthStackProps = ContentDepthSections & {
  className?: string;
};

export function ContentDepthStack({
  scenariosTitle = "How teams use EstateDesk in practice",
  scenarios,
  problemsTitle = "Problems EstateDesk helps solve",
  problems,
  guidesTitle = "Related guides and search paths",
  guides,
  editorialTitle = "Deeper context for property teams",
  editorial,
  className = "",
}: ContentDepthStackProps) {
  const hasScenarios = Boolean(scenarios?.length);
  const hasProblems = Boolean(problems?.length);
  const hasGuides = Boolean(guides?.length);
  const hasEditorial = Boolean(editorial?.length);

  if (!hasScenarios && !hasProblems && !hasGuides && !hasEditorial) {
    return null;
  }

  return (
    <div className={className}>
      {hasEditorial ? (
        <section className="border-y border-neutral-200 bg-white py-10 dark:border-white/10 dark:bg-[#0f1319] sm:py-12 lg:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
              <BookOpen className="h-3.5 w-3.5" />
              Editorial depth
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-3xl">
              {editorialTitle}
            </h2>
            <div className="mt-5 grid gap-4 text-base leading-8 text-neutral-600 dark:text-[#d1d5db]">
              {editorial?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {hasScenarios ? (
        <section className="border-b border-neutral-200 bg-[#f7f9fc] py-10 dark:border-white/10 dark:bg-[#151922] sm:py-12 lg:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
              <Workflow className="h-3.5 w-3.5" />
              Workflow scenarios
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-3xl">
              {scenariosTitle}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {scenarios?.map((scenario) => (
                <article
                  key={scenario.title}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/12 dark:bg-white/[0.07]"
                >
                  <h3 className="text-base font-semibold text-neutral-950 dark:text-[#f8fafc]">
                    {scenario.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">
                    {scenario.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {hasProblems ? (
        <section className="bg-white py-10 dark:bg-[#0f1319] sm:py-12 lg:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
              <CircleHelp className="h-3.5 w-3.5" />
              Problem and solution
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-3xl">
              {problemsTitle}
            </h2>
            <div className="mt-6 grid gap-4">
              {problems?.map((item) => (
                <article
                  key={item.problem}
                  className="rounded-2xl border border-neutral-200 bg-[#fbfcfe] p-5 dark:border-white/12 dark:bg-white/[0.07]"
                >
                  <p className="text-sm font-semibold text-neutral-950 dark:text-[#f8fafc]">
                    {item.problem}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">
                    {item.solution}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {hasGuides ? (
        <section className="border-t border-neutral-200 bg-[#f7f9fc] py-10 dark:border-white/10 dark:bg-[#151922] sm:py-12 lg:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600 dark:border-white/14 dark:bg-white/[0.08] dark:text-[#e5e7eb]">
              <Layers3 className="h-3.5 w-3.5" />
              Topic guides
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-[#f8fafc] sm:text-3xl">
              {guidesTitle}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {guides?.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/12 dark:bg-white/[0.07] dark:hover:border-white/22 dark:hover:bg-white/[0.10]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-neutral-950 dark:text-[#f8fafc]">
                        {guide.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-[#d1d5db]">
                        {guide.description}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-500 transition group-hover:translate-x-0.5 dark:text-[#d1d5db]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}