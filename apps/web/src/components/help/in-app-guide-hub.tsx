import Link from "next/link";
import { BookOpen, Lock, Shield } from "lucide-react";
import type { HelpWorkspace } from "@/lib/help/help-workspace";
import {
  getHelpWorkspaceLabel,
  getInAppHelpArticlePath,
} from "@/lib/help/help-workspace";
import {
  getInAppGuideTopic,
  listUniqueGuideTopicsForWorkspace,
  resolveGuideSlugForWorkspace,
  type InAppGuideTopic,
} from "@/lib/help/in-app-guides";
import { getGuideBySlug } from "@/lib/guides";
import type { OrgRole } from "@prisma/client";

const workspaceIntro: Record<HelpWorkspace, string> = {
  org: "Guides for property office staff: portfolio, payments, water approvals, tenants, and roles. They do not include platform engineering secrets or other companies' data.",
  tenant:
    "Guides for your tenancy only: bills, payments, maintenance, and lease info. You will not see staff tools or other tenants' information.",
  caretaker:
    "Guides for field work on units assigned to you: readings, issues, and inspections. Billing approval and org settings stay with the office.",
  landlord:
    "Guides for owner-facing portfolio review. Day-to-day office billing controls remain with your property team.",
  platform:
    "Guides for EstateDesk platform operators (administration and support). Deep engineering system docs live under Developer → System Docs.",
};

export function InAppGuideHub({
  workspace,
  orgRole,
}: {
  workspace: HelpWorkspace;
  orgRole?: OrgRole | null;
}) {
  const topics = listUniqueGuideTopicsForWorkspace(workspace, orgRole);

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
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            Workspace help
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <Lock className="h-3 w-3" />
            Private to your role
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Help for {getHelpWorkspaceLabel(workspace).toLowerCase()}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {workspaceIntro[workspace]}
        </p>
        <p className="mt-3 inline-flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Not published on the public website, sitemaps, or search. Other roles cannot open
          these URLs from their own help hub.
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
  const slug = resolveGuideSlugForWorkspace(topic, workspace);
  const guide = getGuideBySlug(slug);

  if (!guide) return null;

  return (
    <Link
      href={getInAppHelpArticlePath(workspace, slug)}
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
        {guide.privateInApp || guide.privatePlatform ? " · private" : ""}
      </p>
    </Link>
  );
}