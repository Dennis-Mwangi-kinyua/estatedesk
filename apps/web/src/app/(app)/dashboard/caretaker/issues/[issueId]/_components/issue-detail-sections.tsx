import Link from "next/link";
import { TicketStatus } from "@prisma/client";
import { encodePublicId } from "@/lib/public-id";
import { ContactActions } from "@/app/(app)/dashboard/caretaker/_components/contact-actions";
import { CompletionReportForm } from "@/app/(app)/dashboard/caretaker/issues/_components/completion-report-form";
import {
  getCaretakerTenantHref,
  getCaretakerUnitHref,
} from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { IssueCardActions } from "@/app/(app)/dashboard/caretaker/issues/_components/issue-card-actions";
import { formatDateTime } from "@/app/(app)/dashboard/caretaker/issues/_lib/helpers";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerIssueDetail } from "../_lib/queries";
import { getIssuePhotoUrl } from "../_lib/helpers";

export function IssueDetailSections({
  issue,
  currentUserId,
}: {
  issue: CaretakerIssueDetail;
  currentUserId: string;
}) {
  const activeTenant = issue.unit?.leases[0]?.tenant ?? null;
  const latestReport = issue.resolutionReports[0] ?? null;
  const canSubmitReport =
    issue.status === TicketStatus.IN_PROGRESS &&
    issue.assignedTo?.id === currentUserId &&
    (!latestReport || latestReport.status === "REJECTED");
  return (
    <div className="space-y-5">
      <section className={panelShellClassName}>
        <SectionIntro eyebrow="Details" title="Issue description" />
        <div className={`space-y-4 ${panelBodyClassName} pt-0`}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {issue.description}
          </p>

          {issue.photoAsset ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/10">
              <img
                src={getIssuePhotoUrl(issue.photoAsset.key)}
                alt={`Evidence for ${issue.title}`}
                className="max-h-80 w-full object-cover"
              />
              <div className="border-t border-border px-4 py-2 text-xs font-medium text-muted-foreground">
                {issue.photoAsset.fileName}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panelShellClassName}>
          <SectionIntro eyebrow="Reporter" title="Reported by" />
          <div className={`space-y-4 ${panelBodyClassName} pt-0`}>
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-sm font-semibold text-foreground">
                {issue.reportedBy.fullName ?? "Unknown"}
              </p>
              {issue.reportedBy.email ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {issue.reportedBy.email}
                </p>
              ) : null}
              <div className="mt-3">
                <ContactActions
                  phone={issue.reportedBy.phone}
                  email={issue.reportedBy.email}
                  compact
                />
              </div>
            </div>
          </div>
        </section>

        <section className={panelShellClassName}>
          <SectionIntro eyebrow="Unit" title="Location & tenant" />
          <div className={`space-y-4 ${panelBodyClassName} pt-0`}>
            {issue.unit ? (
              <>
                <div className="rounded-2xl border border-border bg-muted/10 p-4">
                  <p className="text-sm text-muted-foreground">Unit</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {[
                      issue.unit.property.name,
                      issue.unit.building?.name,
                      `Unit ${issue.unit.houseNo}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <Link
                    href={getCaretakerUnitHref(issue.unit.id)}
                    className="mt-3 inline-flex text-sm font-semibold text-primary transition hover:text-primary/80"
                  >
                    Open unit profile
                  </Link>
                </div>

                {activeTenant ? (
                  <div className="rounded-2xl border border-border bg-muted/10 p-4">
                    <p className="text-sm text-muted-foreground">Active tenant</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {activeTenant.fullName}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href={getCaretakerTenantHref(activeTenant.id)}
                        className="text-sm font-semibold text-primary transition hover:text-primary/80"
                      >
                        View tenant record
                      </Link>
                      <ContactActions
                        phone={activeTenant.phone}
                        email={activeTenant.email}
                        compact
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
                    No active tenant on this unit.
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
                This issue is not linked to a specific unit.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className={panelShellClassName}>
        <SectionIntro eyebrow="Field work" title="Issue actions" />
        <div className={`space-y-4 ${panelBodyClassName} pt-0`}>
          <Link
            href={`/dashboard/caretaker/vendors?issueId=${encodePublicId(
              issue.id,
              "issue",
            )}`}
            className="inline-flex rounded-2xl border border-border bg-muted/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-muted/20"
          >
            Request vendor dispatch
          </Link>

          <IssueCardActions issue={issue} currentUserId={currentUserId} />

          {issue.resolutionNotes &&
          issue.status === TicketStatus.IN_PROGRESS ? (
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-sm font-semibold text-foreground">Progress notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {issue.resolutionNotes}
              </p>
            </div>
          ) : null}

          {latestReport ? (
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Completion report
                </p>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {latestReport.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {latestReport.workSummary}
              </p>
              {latestReport.materialsUsed ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Materials: {latestReport.materialsUsed}
                </p>
              ) : null}
              {latestReport.tenantInstructions ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Tenant instructions: {latestReport.tenantInstructions}
                </p>
              ) : null}
              {latestReport.officeNotes ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Office notes: {latestReport.officeNotes}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Submitted {formatDateTime(latestReport.submittedAt)}
              </p>
            </div>
          ) : null}

          {canSubmitReport ? <CompletionReportForm issueId={issue.id} /> : null}
        </div>
      </section>
    </div>
  );
}