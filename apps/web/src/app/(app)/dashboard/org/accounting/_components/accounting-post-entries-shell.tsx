import Link from "next/link";
import { FilePenLine, NotebookPen, Receipt } from "lucide-react";
import type { ReactNode } from "react";
import { buildAccountingPageHref } from "../_lib/helpers";
import type { AccountingEntryType } from "../_lib/types";

const ENTRY_TABS: Array<{
  id: AccountingEntryType;
  label: string;
  Icon: typeof Receipt;
}> = [
  { id: "expense", label: "Paid expense", Icon: Receipt },
  { id: "bill", label: "Vendor bill", Icon: NotebookPen },
  { id: "journal", label: "Manual journal", Icon: FilePenLine },
];

export function AccountingPostEntriesShell({
  activeEntry,
  expense,
  bill,
  journal,
}: {
  activeEntry: AccountingEntryType;
  expense: ReactNode;
  bill: ReactNode;
  journal: ReactNode;
}) {
  const panels: Record<AccountingEntryType, ReactNode> = {
    expense,
    bill,
    journal,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {ENTRY_TABS.map((entry) => {
          const selected = activeEntry === entry.id;

          return (
            <Link
              key={entry.id}
              href={buildAccountingPageHref({
                tab: "transactions",
                entry: entry.id,
              })}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                selected
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <entry.Icon className="h-4 w-4" />
              {entry.label}
            </Link>
          );
        })}
      </div>

      {panels[activeEntry]}
    </div>
  );
}