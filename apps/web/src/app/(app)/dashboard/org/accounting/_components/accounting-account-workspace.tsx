import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";
import {
  DataCard,
  DataCardRow,
  ResponsiveDataList,
} from "@/components/ui/responsive-data-list";
import type { getAccountLedgerPage } from "@/lib/accounting/journal-queries";
import {
  buttonSecondaryClassName,
  formatDate,
  formatMoney,
} from "../_lib/helpers";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

type AccountLedgerData = NonNullable<Awaited<ReturnType<typeof getAccountLedgerPage>>>;

export function AccountingAccountWorkspace({
  data,
  currencyCode,
}: {
  data: AccountLedgerData;
  currencyCode: string;
}) {
  const { account, balance, lines } = data;

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/org/accounting/coa"
        className={`${buttonSecondaryClassName} inline-flex`}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to chart of accounts
      </Link>

      <section className={panelShellClassName}>
        <SectionHeader
          icon={Landmark}
          title={`${account.code} · ${account.name}`}
          description={`${account.type} account · ${account.normalBalance} normal balance`}
        />

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">YTD balance</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatMoney(balance, currencyCode)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Status</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {account.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Parent</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {account.parent ? `${account.parent.code} · ${account.parent.name}` : "—"}
            </p>
          </div>
        </div>

        {account.description ? (
          <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground sm:px-6">
            {account.description}
          </p>
        ) : null}
      </section>

      <section className={panelShellClassName}>
        <SectionHeader title="Account activity" description="Recent posted journal lines for this account." />
        {lines.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
            No posted activity for this account yet.
          </p>
        ) : (
          <ResponsiveDataList
            mobile={
              <ul className="divide-y divide-border">
                {lines.map((line) => (
                  <li key={line.id}>
                    <DataCard>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href="/dashboard/org/accounting/journals"
                          className="text-sm font-semibold text-foreground hover:text-primary"
                        >
                          {line.journal.entryNumber}
                        </Link>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatDate(line.journal.entryDate)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {line.description || line.journal.description}
                      </p>
                      <dl className="mt-2.5 space-y-1.5 rounded-xl border border-border bg-muted/20 p-2.5">
                        <DataCardRow
                          label="Debit"
                          value={
                            Number(line.debit) > 0
                              ? formatMoney(Number(line.debit), currencyCode)
                              : "—"
                          }
                        />
                        <DataCardRow
                          label="Credit"
                          value={
                            Number(line.credit) > 0
                              ? formatMoney(Number(line.credit), currencyCode)
                              : "—"
                          }
                        />
                      </dl>
                    </DataCard>
                  </li>
                ))}
              </ul>
            }
            desktop={
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/20 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Journal</th>
                    <th className="px-5 py-3 font-semibold">Description</th>
                    <th className="px-5 py-3 font-semibold">Debit</th>
                    <th className="px-5 py-3 font-semibold">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id} className="border-b border-border/70">
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(line.journal.entryDate)}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href="/dashboard/org/accounting/journals"
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {line.journal.entryNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {line.description || line.journal.description}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {Number(line.debit) > 0
                          ? formatMoney(Number(line.debit), currencyCode)
                          : "—"}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {Number(line.credit) > 0
                          ? formatMoney(Number(line.credit), currencyCode)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        )}
      </section>
    </div>
  );
}