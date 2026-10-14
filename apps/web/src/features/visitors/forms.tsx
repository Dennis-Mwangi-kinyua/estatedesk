"use client";
import { useActionState, useEffect, useState } from "react";
import { createVisitorPass, revokeVisitorPass, verifyVisitorPass, admitVisitorPass, assignGateStaff, type VisitorState, type GateState } from "./actions";
const field = "block min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base";
const button = "min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50";
function Feedback({ state }: { state: VisitorState }) { return <>{state.error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{state.error}</p>}{state.message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{state.message}</p>}</>; }
export function VisitorForm() {
  const [state, action, pending] = useActionState(createVisitorPass, {});
  return <form action={form => {
    // datetime-local is the user's local time; send an unambiguous instant to the server.
    for (const key of ["validFrom", "validUntil"]) { const value = String(form.get(key)); const date = new Date(value); if (!Number.isNaN(date.getTime())) form.set(key, date.toISOString()); }
    action(form);
  }} className="space-y-4 rounded-2xl border bg-card p-5">
    <h2 className="text-xl font-semibold">Invite a visitor</h2>
    <label className="block space-y-1">Visitor name<input className={field} name="visitorName" required minLength={2} maxLength={120} autoComplete="off" /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1">Phone (optional)<input className={field} name="visitorPhone" type="tel" maxLength={25} /></label><label className="block space-y-1">Vehicle plate (optional)<input className={field} name="vehiclePlate" maxLength={25} /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1">Valid from<input className={field} name="validFrom" type="datetime-local" required /></label><label className="block space-y-1">Valid until<input className={field} name="validUntil" type="datetime-local" required /></label></div>
    <p className="text-sm text-muted-foreground">Single entry, up to 24 hours. Times use your device’s time zone. Gate staff will confirm the visitor&apos;s details before admitting them.</p>
    <Feedback state={state} /><button className={button} disabled={pending}>{pending ? "Creating…" : "Generate QR pass"}</button>
    {state.qr && state.url && <div className="space-y-3 border-t pt-4">
      {/* QR data stays local to this response; no external image service receives the pass. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={state.qr} alt="Visitor gate entry QR code" width={280} height={280} className="max-w-full rounded-xl" />
      <div className="flex flex-wrap gap-3"><a href={state.qr} download="estatedesk-visitor-pass.png" className="underline">Download QR</a><a href={`https://wa.me/?text=${encodeURIComponent(`EstateDesk visitor pass. Open at the gate: ${state.url}`)}`} target="_blank" rel="noopener noreferrer" className="underline">Share on WhatsApp</a><button type="button" className="underline" onClick={async () => { if (navigator.share) { try { await navigator.share({ title: "Visitor pass", url: state.url }); } catch {} } else { await navigator.clipboard.writeText(state.url!); } }}>Share / copy pass</button></div>
      <p className="break-all text-xs text-muted-foreground">Pass code: {state.url.split("#pass=")[1]}</p>
    </div>}
  </form>;
}
export function RevokePass({ id }: { id: string }) { const [state, action, pending] = useActionState(revokeVisitorPass, {}); return <form action={action}><input type="hidden" name="id" value={id} /><button className="min-h-11 text-sm text-red-700 underline dark:text-red-300" disabled={pending}>Revoke pass</button><Feedback state={state} /></form>; }
export function GateVerifier() {
  const [token, setToken] = useState("");
  const [state, action, pending] = useActionState<GateState, FormData>(verifyVisitorPass, {});
  const [admission, admit, admitting] = useActionState<GateState, FormData>(admitVisitorPass, {});
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Read the external QR fragment after hydration.
  useEffect(() => { const fragment = new URLSearchParams(window.location.hash.slice(1)); const code = fragment.get("pass"); if (code) { setToken(code); history.replaceState(null, "", window.location.pathname); } }, []);
  const pass = state.pass;
  return <section className="space-y-5 rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">Verify visitor pass</h2><p className="text-sm text-muted-foreground">Scan the QR with your phone camera to open this page, or paste the pass link or code below. Sign in with your assigned staff account.</p>
    <form action={action} className="space-y-3"><label className="block space-y-1">Pass code<input className={field} name="token" required value={token} autoComplete="off" onChange={e => { const value = e.target.value; setToken(value.includes("#pass=") ? value.split("#pass=")[1] : value); }} /></label><button className={button} disabled={pending}>{pending ? "Checking…" : "Verify details"}</button><Feedback state={state} /></form>
    {pass && <div className="space-y-3 border-t pt-4"><p className="text-lg font-semibold">{pass.visitorName}</p><dl className="grid gap-2 text-sm"><div>Tenant: {pass.tenant}</div><div>Property: {pass.property} · Unit {pass.unit}</div>{pass.visitorPhone && <div>Phone: {pass.visitorPhone}</div>}{pass.vehiclePlate && <div>Vehicle: {pass.vehiclePlate}</div>}<div>From {new Date(pass.validFrom).toLocaleString()} until {new Date(pass.validUntil).toLocaleString()}</div><div className="font-semibold">Status: {pass.status.toLowerCase()}</div></dl>
    {pass.status === "READY" && admission.admittedId !== pass.id && <form action={admit} className="space-y-3"><input type="hidden" name="id" value={pass.id} /><p className="text-sm text-muted-foreground">Confirm the visitor matches these details, then record admission.</p><button className={button} disabled={admitting}>Confirm and admit visitor</button></form>}<Feedback state={admission.admittedId === pass.id ? admission : {}} /></div>}
  </section>;
}
export function GateAssignmentForm({ properties, staff }: { properties: { id: string; name: string }[]; staff: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(assignGateStaff, {});
  return <form action={action} className="space-y-4 rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">Assign gate staff</h2><p className="text-sm text-muted-foreground">Create a caretaker or office staff account first, then assign the property gates they can verify.</p><label className="block">Property<select name="propertyId" className={field} required><option value="">Choose property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="block">Staff member<select name="userId" className={field} required><option value="">Choose staff</option>{staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="flex items-center gap-2"><input type="checkbox" name="remove" value="1" />Remove this assignment</label><Feedback state={state} /><button className={button} disabled={pending}>Update gate access</button></form>;
}
