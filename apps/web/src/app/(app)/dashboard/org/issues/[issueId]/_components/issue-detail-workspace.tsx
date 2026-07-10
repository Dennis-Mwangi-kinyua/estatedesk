import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import type { IssueDetailPageData } from "../../_lib/types";
import {
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
  getStatusClasses,
} from "../../_lib/helpers";
import { IssueDetailsCard } from "../../_components/issue-details-card";
import { IssuesGuidance } from "../../_components/issues-guidance";
import { panelShellClassName } from "../../_components/issues-ui";

type IssueDetailWorkspaceProps = {
  data: IssueDetailPageData;
  orgRole?: OrgRole | null;
};

export function IssueDetailWorkspace({ data, orgRole }: IssueDetailWorkspaceProps) {
  const { issue } = data;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={panelShellClassName}>
        <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Link
                href="/dashboard/org/issues"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to issues
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusClasses(
                    issue.status,
                  )}`}
                >
                  {issue.status.replaceAll("_", " ")}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getPriorityClasses(
                    issue.priority,
                  )}`}
                >
                  {issue.priority}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {issue.title}
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                {getIssueUnitLabel(issue)} • Created {formatDate(issue.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <IssueDetailsCard
          issue={issue}
          caretakers={data.caretakers}
          currentPage={1}
          activeFilter="all"
          canAssignCaretaker={data.canAssignCaretaker}
        />

        <IssuesGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}