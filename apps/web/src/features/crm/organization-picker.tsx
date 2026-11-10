"use client";
import { useId, useState, useTransition } from "react";
import { searchCrmOrganizations } from "./actions";
export function OrganizationPicker({ initial }: { initial: { id: string; name: string; email: string | null } | null }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initial?.id ?? "");
  const [options, setOptions] = useState(initial ? [initial] : []);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  return <div className="space-y-2">
    <label htmlFor={`${id}-search`} className="text-sm font-medium">Find customer organization</label>
    <div className="flex gap-2">
      <input id={`${id}-search`} value={query} onChange={e => setQuery(e.target.value)} placeholder="Organization name or email" className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm" />
      <button type="button" disabled={pending || query.trim().length < 2} className="rounded-lg border px-3 text-sm disabled:opacity-50" onClick={() => start(async () => { try { const matches = await searchCrmOrganizations(query); setOptions(previous => [...new Map([...previous.filter(o => o.id === selected), ...matches].map(o => [o.id, o])).values()]); setMessage(matches.length ? `${matches.length} matching organizations. Select the customer below.` : "No matching organizations. Try another search."); } catch { setMessage("Search failed. Try again."); } })}>{pending ? "Searching…" : "Search"}</button>
    </div>
    <label htmlFor={`${id}-selected`} className="block text-xs text-muted-foreground">Linked customer</label>
    <select id={`${id}-selected`} name="customerOrgId" value={selected} onChange={e => setSelected(e.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
      <option value="">No linked customer</option>
      {options.map(o => <option key={o.id} value={o.id}>
        {o.name}{" "}{o.email ? ` · ${o.email}` : ""}
      </option>)}
    </select>
    {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
  </div>;
}
