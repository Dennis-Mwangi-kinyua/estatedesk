"use client";

import { useState, type ReactNode } from "react";

type BankDetails = { id: string; name: string; enabled: boolean; details: ReactNode };

export function BankDetailsSearch({ banks }: { banks: BankDetails[] }) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const matches = banks.filter(bank => term ? bank.name.toLowerCase().includes(term) : bank.enabled);
  return <div className="mt-4 space-y-4">
    <label className="grid gap-2 text-sm font-medium">
      Search for a bank
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="e.g. Equity, Co-operative, Family" className="min-h-12 w-full rounded-xl border border-border bg-background px-4" />
    </label>
    <p role="status" className="text-sm text-muted-foreground">
      {term ? `${matches.length} matching bank${matches.length === 1 ? "" : "s"}` : "Showing enabled banks. Search to add or edit another bank."}
    </p>
    {term && matches.length === 0 ? <p className="text-sm">No matching bank. Try another name.</p> : null}
    {banks.map(bank => <div key={bank.id} hidden={!matches.includes(bank)}>{bank.details}</div>)}
  </div>;
}
