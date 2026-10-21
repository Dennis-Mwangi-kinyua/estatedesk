"use client";

import { useState } from "react";
import { openingArrearsPeriods } from "@/lib/tenants/opening-arrears";
import { inputClassName } from "../_lib/constants";
import { formatCurrency } from "../_lib/helpers";

export function OpeningArrearsFields({ existing, disabled, currencyCode }: { existing: boolean; disabled: boolean; currencyCode: string }) {
  const [periods, setPeriods] = useState(() => openingArrearsPeriods());
  const [year, setYear] = useState(() => String(Number(openingArrearsPeriods()[11].slice(0, 4)) - 1));
  const [yearError, setYearError] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const total = Object.values(amounts).reduce((sum, value) => sum + Math.round((Number(value) || 0) * 100), 0) / 100;

  function addYear() {
    const latest = openingArrearsPeriods()[0];
    if (!/^\d{1,4}$/.test(year) || Number(year) < 1 || Number(year) > Number(latest.slice(0, 4))) {
      setYearError("Enter a past year or the current year with completed months.");
      return;
    }
    const extra = Array.from({ length: 12 }, (_, month) => `${year.padStart(4, "0")}-${String(month + 1).padStart(2, "0")}`).filter(period => period <= latest);
    setPeriods(previous => [...new Set([...previous, ...extra])].sort().reverse());
    setYearError(null);
  }

  if (!existing) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 md:col-span-2">
      <h3 className="font-semibold">Previous unpaid bills</h3>
      <p className="text-sm text-muted-foreground">Enter the unpaid balance for each month after previous payments. Add as many past years as needed, back to the original lease start date. Leave settled months blank. Current and future bills remain separate.</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm">Year to add
          <input type="number" min="1" max={Number(openingArrearsPeriods()[0].slice(0, 4))} step="1" value={year} onChange={event => setYear(event.target.value)} disabled={disabled} className={inputClassName} />
        </label>
        <button type="button" onClick={addYear} disabled={disabled} className="min-h-12 rounded-xl border border-border px-4 text-sm font-semibold">Add year</button>
      </div>
      {yearError ? <p role="alert" className="text-sm text-destructive">{yearError}</p> : null}
      {[...new Set(periods.map(period => period.slice(0, 4)))].map(periodYear => (
        <fieldset key={periodYear} className="space-y-3">
          <legend className="font-semibold">Unpaid bills — {periodYear}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {periods.filter(period => period.startsWith(`${periodYear}-`)).map(period => (
              <label key={period} className="space-y-1 text-sm">
                <span>Previous balance for {period} ({currencyCode})</span>
                <input name={`openingArrears:${period}`} type="number" min="0" max="999999999.99" step="0.01" inputMode="decimal" value={amounts[period] ?? ""} onChange={event => setAmounts(previous => ({ ...previous, [period]: event.target.value }))} disabled={disabled} className={inputClassName} placeholder="0.00" />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <p className="font-semibold">Total previous arrears: {formatCurrency(total, currencyCode)}</p>
    </div>
  );
}
