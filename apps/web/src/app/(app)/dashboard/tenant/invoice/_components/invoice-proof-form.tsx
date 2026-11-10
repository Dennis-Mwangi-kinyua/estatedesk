"use client";

import { useState } from "react";
import { submitInvoiceProofAction } from "../proof-action";

export function InvoiceProofForm({ periods }: { periods: { period: string; balanceLabel: string }[] }) {
  const [method, setMethod] = useState("manual-mpesa");
  const needsReference = method !== "cash";
  return (
    <form action={submitInvoiceProofAction} className="rounded-[28px] border border-border bg-card p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
      <h2 className="text-[22px] font-semibold tracking-tight">Attach payment proof</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Send the M-Pesa code, bank reference, or a cash note for an open month. The office matches it and issues the receipt.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Month
          <select name="period" defaultValue={periods[0]?.period} className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3">
            {periods.map((item) => <option key={item.period} value={item.period}>{item.period} · {item.balanceLabel} due</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Method
          <select name="method" value={method} onChange={(event) => setMethod(event.target.value)} className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3">
            <option value="manual-mpesa">M-Pesa</option>
            <option value="manual-bank">Bank</option>
            <option value="cash">Cash</option>
          </select>
        </label>
        {needsReference ? (
          <label className="text-sm font-medium sm:col-span-2">Reference
            <input name="transactionId" required minLength={method === "manual-mpesa" ? 10 : 4} maxLength={method === "manual-mpesa" ? 10 : 100} className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" placeholder={method === "manual-mpesa" ? "10-character M-Pesa code" : "Bank transfer reference"} />
          </label>
        ) : null}
        <label className="text-sm font-medium sm:col-span-2">{needsReference ? "Note (optional)" : "Cash note"}
          <input name="note" required={!needsReference} minLength={needsReference ? undefined : 3} maxLength={240} className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" placeholder={needsReference ? "Who paid, or where the cash was handed in" : "Handed to the office on Monday"} />
        </label>
        <label className="text-sm font-medium">Amount (optional)
          <input name="amount" inputMode="decimal" className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" placeholder="Leave blank to use the full balance" />
        </label>
        <label className="text-sm font-medium">Slip image (optional)
          <input name="proofImage" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" />
        </label>
      </div>
      <button type="submit" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[16px] bg-neutral-900 px-4 text-sm font-medium text-white">Send proof to the office</button>
    </form>
  );
}
