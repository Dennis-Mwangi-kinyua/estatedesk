import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { Wrench } from "lucide-react";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { canCreateOrgIssue } from "@/lib/issues/share-routing";
import { SurfaceCard } from "./issues-page-shell";

export function IssuesEmptyState({
  organizationName,
  role,
}: {
  organizationName: string;
  role: OrgRole;
}) {
  const canReport = canCreateOrgIssue(role);

  return (
    <SurfaceCard className="p-6 sm:p-8">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/30">
          <Wrench className="h-7 w-7 text-muted-foreground" />
        </div>

        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          No issues yet
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          There are no issue tickets for {organizationName} right now. When
          maintenance is reported, tickets will appear here with assignment,
          status, and searchable history.
        </p>

        <div className="mt-5 flex justify-center">
          <InAppGuideLink topic="issues" workspace="org" orgRole={role} />
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {canReport ? (
            <Link
              href="/dashboard/org/issues/new"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Report first issue
            </Link>
          ) : null}
          <Link
            href="/dashboard/org"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step 1
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">Describe the problem</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Add a clear title, description, priority, and property context.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step 2
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">Assign follow-up</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Allocate the ticket to a caretaker so work moves into progress.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Step 3
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">Track to closure</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Review status updates and resolution history from one desk.
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
}