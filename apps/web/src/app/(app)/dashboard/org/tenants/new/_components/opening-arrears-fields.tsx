"use client";
import { useState } from "react";
import { openingArrearsPeriods } from "@/lib/tenants/opening-arrears";
import { inputClassName } from "../_lib/constants";
import { formatCurrency } from "../_lib/helpers";

export function OpeningArrearsFields({ disabled, currencyCode }: { disabled: boolean; currencyCode: string }) {
  const [existing, setExisting] = useState(false);
  const [periods] = useState(() => openingArrearsPeriods());
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const total = Object.values(amounts).reduce((sum, value) => sum + Math.round((Number(value) || 0) * 100), 0) / 100;
  return <div className="space-y-4 rounded-2xl border border-border bg-card p-4 md:col-span-2">
    <label className="flex items-start gap-3"><input type="checkbox" name="existingLease" checked={existing} onChange={event => setExisting(event.target.checked)} disabled={disabled} className="mt-1" /><span><span className="block font-semibold">Onboard an existing lease</span><span className="text-sm text-muted-foreground">Use the original lease start date and assign the tenant’s unit. Initial rent and deposit charges will not be recreated.</span></span></label>
    {existing ? <>
      <h3 className="font-semibold">Previous arrears — last 12 completed months</h3>
      <p className="text-sm text-muted-foreground">Enter only the unpaid balance for each month, after any previous payments. Leave settled months blank. These opening balances add to total arrears; current and future bills remain separate.</p>
      <div className="grid gap-3 sm:grid-cols-2">{periods.map(period => <label key={period} className="space-y-1 text-sm"><span>Previous balance for {period} ({currencyCode})</span><input name={`openingArrears:${period}`} type="number" min="0" max="999999999.99" step="0.01" inputMode="decimal" value={amounts[period] ?? ""} onChange={event => setAmounts(previous => ({ ...previous, [period]: event.target.value }))} disabled={disabled} className={inputClassName} placeholder="0.00" /></label>)}</div>
      <p className="font-semibold">Total previous arrears: {formatCurrency(total, currencyCode)}</p>
    </> : null}
  </div>;
}
