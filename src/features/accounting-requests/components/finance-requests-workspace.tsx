import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";
import type { FinanceRequestsPageData } from "../_lib/types";
import { FinanceRequestForm } from "./finance-request-form";
import { FinanceRequestsList } from "./finance-requests-list";

export function FinanceRequestsWorkspace({
  data,
  workspace,
  message,
  focusId,
}: {
  data: FinanceRequestsPageData;
  workspace: "caretaker" | "org";
  message?: string;
  focusId?: string;
}) {
  const backHref =
    workspace === "caretaker" ? "/dashboard/caretaker" : "/dashboard/org";

  const shellClassName =
    workspace === "org"
      ? "org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8"
      : "mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 pt-4 sm:px-6";

  return (
    <div className={shellClassName}>
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <Link
            href={backHref}
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
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Submit spend tickets to {data.org.name} accounts. Approved or rejected
            requests return feedback here and in your notifications.
          </p>
        </div>

        {message ? (
          <div className="border-b border-border bg-muted/15 px-5 py-4 sm:px-6">
            <p className="text-sm leading-6 text-foreground">{message}</p>
          </div>
        ) : null}
      </section>

      <FinanceRequestForm data={data} workspace={workspace} />
      <FinanceRequestsList data={data} workspace={workspace} focusId={focusId} />
    </div>
  );
}