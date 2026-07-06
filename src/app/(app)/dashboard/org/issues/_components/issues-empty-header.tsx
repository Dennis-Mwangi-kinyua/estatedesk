import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, Wrench } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { canCreateOrgIssue } from "@/lib/issues/share-routing";
import { ISSUE_TRACKING_WORKFLOW } from "../_lib/constants";
import { panelShellClassName } from "./issues-ui";

type IssuesEmptyHeaderProps = {
  organizationName: string;
  role: OrgRole;
  orgRole?: OrgRole | null;
};

export function IssuesEmptyHeader({
  organizationName,
  role,
  orgRole,
}: IssuesEmptyHeaderProps) {
  const canReport = canCreateOrgIssue(role);

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" />
              Organization operations
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Issues
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Mobile-first issue workflow for {organizationName}. Report
              maintenance tickets, assign caretakers, and track every stage from
              report to closure.
            </p>

            <InAppGuideHint topic="issues" workspace="org" orgRole={orgRole} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            {canReport ? (
              <Link
                href="/dashboard/org/issues/new"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Report first issue
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-3 sm:px-6">
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Open tickets
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">0</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            New issues
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">0</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Organization
          </p>
          <p className="mt-2 truncate text-lg font-semibold text-foreground">
            {organizationName}
          </p>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {ISSUE_TRACKING_WORKFLOW.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-border bg-muted/15 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {item.step}
              </span>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}