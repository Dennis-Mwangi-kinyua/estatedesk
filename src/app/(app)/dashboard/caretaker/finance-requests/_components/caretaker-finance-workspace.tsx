import Link from "next/link";
import { ArrowLeft, Clock3, Landmark, Receipt, XCircle } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
  StatCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { FinanceRequestForm } from "@/features/accounting-requests/components/finance-request-form";
import { FinanceRequestsList } from "@/features/accounting-requests/components/finance-requests-list";
import { PENDING_REVIEW_STATUSES } from "@/features/accounting-requests/_lib/constants";
import type { CaretakerFinanceRequestsPageData } from "../_lib/queries";
import { CaretakerFinanceSidebar } from "./caretaker-finance-sidebar";

const PENDING_STATUSES = new Set(PENDING_REVIEW_STATUSES);

export function CaretakerFinanceWorkspace({
  result,
  message,
  focusId,
}: {
  result: CaretakerFinanceRequestsPageData;
  message?: string;
  focusId?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!result.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load finance requests"
              message={result.errorMessage}
            />
          </div>
        </section>
      ) : (
        <CaretakerFinanceContent
          data={result.data}
          message={message}
          focusId={focusId}
        />
      )}

      <CaretakerWorkspaceFooter note="Spend requests for caretakers in assigned properties" />
    </div>
  );
}

function CaretakerFinanceContent({
  data,
  message,
  focusId,
}: {
  data: Extract<CaretakerFinanceRequestsPageData, { ok: true }>["data"];
  message?: string;
  focusId?: string;
}) {
  const pendingCount = data.requests.filter((request) =>
    PENDING_STATUSES.has(request.status),
  ).length;
  const decidedCount = data.requests.filter(
    (request) => !PENDING_STATUSES.has(request.status),
  ).length;

  return (
    <>
      <section className={panelShellClassName}>
        <div className={panelBodyClassName}>
          <Link
            href="/dashboard/caretaker"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Landmark className="h-3.5 w-3.5" />
            Accounts desk
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Finance requests
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Submit spend tickets to {data.org.name} accounts. Approved or rejected
            requests return feedback here and in your notifications.
          </p>

          <InAppGuideHint topic="caretaker" workspace="caretaker" />
        </div>

        {message ? (
          <div className="border-t border-border bg-muted/15 px-5 py-4 sm:px-6">
            <p className="text-sm leading-6 text-foreground">{message}</p>
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total requests"
          value={data.requests.length}
          note="Spend tickets you have submitted"
          icon={Receipt}
        />
        <StatCard
          label="Pending review"
          value={pendingCount}
          note="Awaiting accounts decision"
          icon={Clock3}
          highlight={pendingCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Decided"
          value={decidedCount}
          note="Approved, rejected, or paid outcomes"
          icon={XCircle}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <FinanceRequestForm data={data} workspace="caretaker" />
          <FinanceRequestsList
            data={data}
            workspace="caretaker"
            focusId={focusId}
          />
        </div>

        <CaretakerFinanceSidebar />
      </div>
    </>
  );
}