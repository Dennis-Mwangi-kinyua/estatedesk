import { WorkflowStepCards } from "@/components/help/workflow-step-list";
import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import Link from "@/components/navigation/workspace-link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { Download, Landmark } from "@/components/shared/colored-icons";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { PAYMENTS_WORKFLOW_STEPS } from "../_lib/constants";
import { formatPeriodLabel } from "../_lib/helpers";
import type { PaymentsPageData } from "../_lib/types";
import { panelShellClassName } from "./payments-ui";

export function PaymentsHeader({
  data,
  orgRole,
}: {
  data: PaymentsPageData;
  orgRole?: OrgRole | null;
}) {
  const { ledger, periodParams, organizationName } = data;

  return (
    <section data-workspace-header className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <VisualSticker label="Payments" size="xs" />
              Tenant ledger
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Payments and balances
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Monthly rent and bill collection for {formatPeriodLabel(ledger.period)} at{" "}
              {organizationName}, including paid tenants, partial payments, unpaid
              accounts, defaults, and total deficit.
            </p>

            <InAppGuideHint topic="rent" workspace="org" orgRole={orgRole} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <Link data-workspace-action="true"
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <Link data-workspace-action="true"
              href="/dashboard/org/charges"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <Landmark className="h-4 w-4" />
              View charges
            </Link>
            <Link data-workspace-action="true"
              href={`/api/org/reports/reconciliation?${periodParams.toString()}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Download reconciliation report
            </Link>
          </div>
        </div>
      </div>

      <details className="border-t border-border">
        <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-5 text-sm font-medium text-muted-foreground sm:px-6"><VisualSticker label="Help" size="xs" /> Workflow overview</summary>
<div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        <WorkflowStepCards steps={PAYMENTS_WORKFLOW_STEPS} />
      </div>
      </details>
    </section>
  );
}