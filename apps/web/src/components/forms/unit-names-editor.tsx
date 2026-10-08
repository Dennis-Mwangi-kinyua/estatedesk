"use client";

import { useActionState, useId, useState } from "react";
import { ListOrdered, LoaderCircle, Pencil } from "lucide-react";
import { renameUnitsAction, type UnitRenameState } from "@/features/units/actions/rename-units";

type UnitNameItem = { id: string; houseNo: string; buildingName?: string | null };
export function UnitNamesEditor({ propertyId, units, scopeLabel = "units shown on this page" }: { propertyId: string; units: UnitNameItem[]; scopeLabel?: string }) {
  const [open,setOpen] = useState(false);
  const [names,setNames] = useState<Record<string,string>>({});
  const [prefix,setPrefix] = useState("A");
  const [start,setStart] = useState("1");
  const [review,setReview] = useState(false);
  const [error,setError] = useState("");
  const [state,action,pending] = useActionState(async (previous: UnitRenameState, formData: FormData) => { const next = await renameUnitsAction(previous, formData); if(next.status === "success"){setOpen(false);setReview(false);setNames({});} return next; },{status:"idle"});
  const id = useId();
  const displayed = units.slice(0,500);
  const changes = displayed.map(unit=>({id:unit.id,previous:unit.houseNo,name:(names[unit.id] ?? unit.houseNo).trim()})).filter(entry=>entry.name !== entry.previous);
  if (!units.length) return null;
  function fillSequence() {
    const number=Number(start);
    if(!Number.isSafeInteger(number)||number<0||number+displayed.length>999999){setError("Enter a starting number between 0 and 999999.");return;}
    setNames(Object.fromEntries(displayed.map((unit,index)=>[unit.id,`${prefix.trim()}${number+index}`])));setReview(false);setError("");
  }
  function preview() {
    if(!changes.length){setError("Change at least one unit name before reviewing.");return;}
    if(changes.some(entry=>!entry.name||entry.name.length>80||/[\x00-\x1f\x7f]/.test(entry.name))){setError("Each unit needs a name with 1–80 characters.");return;}
    setError("");setReview(true);
  }
  return <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><ListOrdered aria-hidden="true" className="h-5 w-5 text-primary"/>Unit naming</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Rename {scopeLabel} in the order displayed. Tenant and lease assignments stay linked to their units.</p></div><button data-workspace-action="true" type="button" disabled={pending} onClick={()=>{setOpen(!open);setReview(false);setError("");}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground"><Pencil aria-hidden="true" className="h-4 w-4"/>{open ? "Close editor" : "Rename units"}</button></div>
    {open && <div className="mt-4 space-y-4">
      {units.length>500 && <p className="text-sm text-muted-foreground">This editor shows the first 500 units. Rename these first, or use the unit directory to work on smaller groups.</p>}
      {!review && <><div className="rounded-xl border border-border bg-muted/15 p-3"><p className="text-sm font-medium text-foreground">Fill a sequence, then adjust any name</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><label className="text-xs text-muted-foreground" htmlFor={`${id}-prefix`}>Prefix<input id={`${id}-prefix`} value={prefix} onChange={event=>setPrefix(event.target.value)} maxLength={60} placeholder="A or B" className="mt-1 min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground"/></label><label className="text-xs text-muted-foreground" htmlFor={`${id}-start`}>Starting number<input id={`${id}-start`} value={start} onChange={event=>setStart(event.target.value)} type="number" min={0} max={999999} className="mt-1 min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground"/></label><button data-workspace-action="true" type="button" onClick={fillSequence} className="col-span-2 min-h-12 rounded-xl border border-border px-4 text-sm font-medium text-foreground sm:col-span-1 sm:self-end">Fill sequence</button></div></div>
      <ol className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">{displayed.map((unit,index)=><li key={unit.id} className="rounded-xl border border-border p-3"><label htmlFor={`${id}-${unit.id}`} className="block text-sm font-medium text-foreground">{index+1}. Unit {unit.houseNo}{unit.buildingName && <span className="ml-2 text-xs font-normal text-muted-foreground">{unit.buildingName}</span>}</label><input id={`${id}-${unit.id}`} value={names[unit.id] ?? unit.houseNo} onChange={event=>{setNames({...names,[unit.id]:event.target.value});setReview(false);}} required maxLength={80} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground"/></li>)}</ol><button data-workspace-action="true" type="button" onClick={preview} className="min-h-12 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground sm:w-auto">Review changes</button></>}
      {review && <form action={action} onSubmit={event=>{if(!review)event.preventDefault();}} className="space-y-4"><input type="hidden" name="propertyId" value={propertyId}/><input type="hidden" name="changes" value={JSON.stringify(changes)}/><p className="text-sm font-medium text-foreground">Review {changes.length} {changes.length===1 ? "name change" : "name changes"} before saving</p><ol className="max-h-80 space-y-2 overflow-y-auto">{changes.map(entry=><li key={entry.id} className="break-words rounded-xl border border-border bg-muted/15 p-3 text-sm text-foreground">{entry.previous} <span aria-hidden="true">→</span> <strong>{entry.name}</strong></li>)}</ol><div className="flex flex-wrap gap-2"><button data-workspace-action="true" type="button" disabled={pending} onClick={()=>setReview(false)} className="min-h-12 rounded-xl border border-border px-4 text-sm text-foreground">Back to editing</button><button data-workspace-action="true" type="submit" disabled={pending||!changes.length} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin"/>}{pending ? "Saving…" : "Save unit names"}</button></div></form>}
    </div>}
    {(error||state.message) && <p role={error||state.status==="error"?"alert":"status"} className={`mt-3 text-sm ${error||state.status==="error"?"text-destructive":"text-emerald-700 dark:text-emerald-300"}`}>{error||state.message}</p>}
  </section>;
}
