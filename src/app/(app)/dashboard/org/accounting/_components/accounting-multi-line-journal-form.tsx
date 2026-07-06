"use client";

import { useMemo, useState } from "react";
import { createMultiLineJournalAction } from "../journal-actions";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  labelClassName,
} from "../_lib/helpers";

type AccountOption = {
  id: string;
  code: string;
  name: string;
};

type LineState = {
  accountId: string;
  debit: string;
  credit: string;
  description: string;
};

const emptyLine = (): LineState => ({
  accountId: "",
  debit: "",
  credit: "",
  description: "",
});

export function AccountingMultiLineJournalForm({
  accounts,
  defaultDate,
}: {
  accounts: AccountOption[];
  defaultDate: string;
}) {
  const [lines, setLines] = useState<LineState[]>([emptyLine(), emptyLine()]);

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const credit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 && debit > 0 };
  }, [lines]);

  function updateLine(index: number, patch: Partial<LineState>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  function addLine() {
    setLines((current) => [...current, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length <= 2 ? current : current.filter((_, i) => i !== index)));
  }

  return (
    <form action={createMultiLineJournalAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClassName}>
          Date
          <input
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            className={fieldClassName}
          />
        </label>

        <label className={labelClassName}>
          Description
          <input name="description" required className={fieldClassName} />
        </label>
      </div>

      <label className={labelClassName}>
        Memo
        <input name="memo" className={fieldClassName} />
      </label>

      <input
        type="hidden"
        name="linesJson"
        value={JSON.stringify(
          lines
            .filter((line) => line.accountId && (line.debit || line.credit))
            .map((line) => ({
              accountId: line.accountId,
              debit: Number(line.debit) || 0,
              credit: Number(line.credit) || 0,
              description: line.description || undefined,
            })),
        )}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Journal lines</h3>
          <button type="button" onClick={addLine} className={buttonSecondaryClassName}>
            Add line
          </button>
        </div>

        {lines.map((line, index) => (
          <div
            key={`line-${index}`}
            className="grid gap-3 rounded-2xl border border-border bg-muted/10 p-4 md:grid-cols-[minmax(0,1.4fr)_120px_120px_minmax(0,1fr)_auto]"
          >
            <label className={labelClassName}>
              Account
              <select
                value={line.accountId}
                onChange={(event) => updateLine(index, { accountId: event.target.value })}
                className={fieldClassName}
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} · {account.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              Debit
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.debit}
                onChange={(event) =>
                  updateLine(index, { debit: event.target.value, credit: "" })
                }
                className={fieldClassName}
              />
            </label>

            <label className={labelClassName}>
              Credit
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.credit}
                onChange={(event) =>
                  updateLine(index, { credit: event.target.value, debit: "" })
                }
                className={fieldClassName}
              />
            </label>

            <label className={labelClassName}>
              Line note
              <input
                value={line.description}
                onChange={(event) => updateLine(index, { description: event.target.value })}
                className={fieldClassName}
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeLine(index)}
                className={buttonSecondaryClassName}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          Debits {totals.debit.toFixed(2)} · Credits {totals.credit.toFixed(2)}
        </span>
        <span
          className={
            totals.balanced
              ? "font-semibold text-emerald-700 dark:text-emerald-300"
              : "font-semibold text-amber-700 dark:text-amber-300"
          }
        >
          {totals.balanced ? "Balanced" : "Not balanced"}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="mode"
          value="post"
          className={buttonPrimaryClassName}
          disabled={!totals.balanced}
        >
          Post journal
        </button>
        <button
          type="submit"
          name="mode"
          value="draft"
          className={buttonSecondaryClassName}
          disabled={!totals.balanced}
        >
          Save draft
        </button>
      </div>
    </form>
  );
}