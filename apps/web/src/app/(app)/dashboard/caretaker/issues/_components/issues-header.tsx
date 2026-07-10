import Link from "next/link";
import { Plus, Wrench } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { CaretakerI18nFormat } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-format";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import type { IssueDataResult } from "@/app/(app)/dashboard/caretaker/issues/_lib/types";
import {
  panelBodyClassName,
  panelShellClassName,
} from "./issues-ui";

type IssuesHeaderProps = {
  issueData: Pick<IssueDataResult, "openIssues" | "urgentIssues">;
};

export function IssuesHeader({ issueData }: IssuesHeaderProps) {
  const attentionCount = issueData.openIssues + issueData.urgentIssues;

  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" />
              <CaretakerI18nLabel labelKey="operations" />
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              <CaretakerI18nLabel labelKey="myIssues" />
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {attentionCount > 0 ? (
                <CaretakerI18nFormat
                  labelKey="issuesNeedAttention"
                  values={{ count: attentionCount }}
                />
              ) : (
                <CaretakerI18nLabel labelKey="issuesNoAttention" />
              )}
            </p>

            <InAppGuideHint topic="caretaker" workspace="caretaker" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/dashboard/caretaker"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <CaretakerI18nLabel labelKey="dashboard" />
            </Link>
            <Link
              href="/dashboard/caretaker/issues/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <CaretakerI18nLabel labelKey="newIssue" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}