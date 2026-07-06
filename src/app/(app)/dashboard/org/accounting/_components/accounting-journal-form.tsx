import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { buttonSecondaryClassName } from "../_lib/helpers";

export function AccountingJournalForm() {
  return (
    <section className="rounded-2xl border border-border bg-muted/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FilePenLine className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Manual journal
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Post balanced multi-line journals, save drafts, and review the full register from the
            journals workspace.
          </p>
          <Link
            href="/dashboard/org/accounting/journals"
            className={`${buttonSecondaryClassName} mt-4 inline-flex`}
          >
            Open journal register
          </Link>
        </div>
      </div>
    </section>
  );
}