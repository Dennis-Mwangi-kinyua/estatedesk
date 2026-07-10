import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { HelpWorkspace } from "@/lib/help/help-workspace";
import {
  getHelpWorkspaceLabel,
  getInAppHelpArticlePath,
} from "@/lib/help/help-workspace";
import {
  getInAppGuideTopic,
  listGuideTopicsForWorkspace,
  type InAppGuideTopic,
} from "@/lib/help/in-app-guides";
import { getGuideBySlug } from "@/lib/guides";
import type { OrgRole } from "@prisma/client";

export function InAppGuideHub({
  workspace,
  orgRole,
}: {
  workspace: HelpWorkspace;
  orgRole?: OrgRole | null;
}) {
  const topics = listGuideTopicsForWorkspace(workspace, orgRole);

  const isOrg = workspace === "org";
  const pageClassName = isOrg
    ? "mx-auto w-full max-w-4xl space-y-6"
    : "ed-theme-page mx-auto w-full max-w-4xl space-y-6 px-3 py-4 sm:px-5 sm:py-6 lg:px-0";
  const cardClassName = isOrg
    ? "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm p-5 sm:p-6"
    : "ed-theme-card rounded-[28px] border p-5 sm:p-6";

  return (
    <div className={pageClassName}>
      <section className={cardClassName}>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          Workspace help
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Help for your role
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          These guides are scoped to the {getHelpWorkspaceLabel(workspace).toLowerCase()}.
          They explain workflows you can access in this protected dashboard.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <GuideHubCard key={topic} topic={topic} workspace={workspace} />
        ))}
      </section>
    </div>
  );
}

function GuideHubCard({
  topic,
  workspace,
}: {
  topic: InAppGuideTopic;
  workspace: HelpWorkspace;
}) {
  const mapping = getInAppGuideTopic(topic);
  const guide = getGuideBySlug(mapping.slug);

  if (!guide) return null;

  return (
    <Link
      href={getInAppHelpArticlePath(workspace, mapping.slug)}
      className={
        workspace === "org"
          ? "overflow-hidden rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm transition hover:bg-muted/20"
          : "ed-theme-card rounded-[24px] border p-5 transition hover:bg-muted/40"
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {guide.category}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
        {mapping.label}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide.summary}</p>
      <p className="mt-4 text-xs font-medium text-muted-foreground">
        {guide.readingMinutes} min read
      </p>
    </Link>
  );
}