import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft, Wrench } from "lucide-react";
import { IssueNewForm, type IssueNewPropertyOption } from "./issue-new-form";
import { IssuesGuidance } from "./issues-guidance";
import { panelShellClassName } from "./issues-ui";

type IssueNewWorkspaceProps = {
  properties: IssueNewPropertyOption[];
  sharedTitle: string;
  sharedDescription: string;
  selectedPropertyId: string;
  selectedUnitId: string;
  isSharedDraft: boolean;
  errorMessage: string | null;
  orgRole?: OrgRole | null;
};

export function IssueNewWorkspace({
  properties,
  sharedTitle,
  sharedDescription,
  selectedPropertyId,
  selectedUnitId,
  isSharedDraft,
  errorMessage,
  orgRole,
}: IssueNewWorkspaceProps) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={panelShellClassName}>
        <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Wrench className="h-3.5 w-3.5" />
                Maintenance reporting
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Report maintenance issue
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Log a maintenance issue for your organization, assign property
                context, and keep office and caretaker teams aligned.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/dashboard/org/issues"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to issues
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <IssueNewForm
          properties={properties}
          sharedTitle={sharedTitle}
          sharedDescription={sharedDescription}
          selectedPropertyId={selectedPropertyId}
          selectedUnitId={selectedUnitId}
          isSharedDraft={isSharedDraft}
          errorMessage={errorMessage}
        />

        <IssuesGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}