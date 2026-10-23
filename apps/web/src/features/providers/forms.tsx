"use client";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { ProviderActionState } from "./actions";
import { providerHeartbeat } from "./actions";
import { SERVICE_CATEGORIES } from "./policy";
export const inputClass = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground";
export const panelClass = "rounded-2xl border border-border bg-card p-5 sm:p-6";
export function ActionForm({ action, children, label = "Save", danger = false }: { action: (state: ProviderActionState, form: FormData) => Promise<ProviderActionState>; children?: ReactNode; label?: string; danger?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const locked = useRef(false);
  const snapshot = useRef<FormData | null>(null);
  const operation = useRef<{ payload: string; token: string } | null>(null);
  const [state, submit, pending] = useActionState(async (previous: ProviderActionState, form: FormData) => {
    snapshot.current = form;
    const payload = JSON.stringify([...form.entries()].filter(([name]) => name !== "_submissionId"));
    if (operation.current?.payload !== payload) operation.current = { payload, token: crypto.randomUUID() };
    form.set("_submissionId", operation.current.token);
    try { const result = await action(previous, form); if (result.message) operation.current = null; return result; }
    catch (error) { if (isRedirectError(error)) throw error; return { error: "The result could not be confirmed. Check the workspace before trying again. Your entries have been kept." }; }
    finally { locked.current = false; }
  }, {});
  const router = useRouter();
  useEffect(() => { if (state.message) router.refresh(); }, [state, router]);
  useEffect(() => {
    if (!state.error || !snapshot.current || !formRef.current) return;
    for (const control of Array.from(formRef.current.elements)) {
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) continue;
      if (!control.name || /password|token|secret|consent|confirm|acceptedTerms/i.test(control.name) || control instanceof HTMLInputElement && ["hidden", "password", "file", "checkbox", "radio"].includes(control.type)) continue;
      const value = snapshot.current.get(control.name);
      if (typeof value === "string") control.value = value;
    }
  }, [state]);
  return <form ref={formRef} action={submit} onSubmitCapture={event => { if (locked.current || pending) event.preventDefault(); else locked.current = true; }} className="space-y-3">{children}<button disabled={pending} className={`min-h-11 rounded-xl px-4 py-2 font-semibold disabled:opacity-60 ${danger ? "bg-red-600 text-white" : "bg-primary text-primary-foreground"}`}>{pending ? "Saving…" : label}</button>{state.error ? <><p role="alert" className="text-sm text-destructive">{state.error}</p><p className="text-xs text-muted-foreground">Your entries are kept here. Re-enter passwords and confirmations before continuing.</p></> : null}{state.message ? <p role="status" className="text-sm text-emerald-600 dark:text-emerald-300">{state.message}</p> : null}</form>;
}
export function Field({ name, label, value, type = "text", required = true, maxLength = 160, autoComplete }: { name: string; label: string; value?: string; type?: string; required?: boolean; maxLength?: number; autoComplete?: string }) { return <label className="block text-sm font-medium">{label}<input className={inputClass} name={name} type={type} step={["budget", "agreedAmount", "amount", "monthlyRent", "deposit"].includes(name) ? "0.01" : undefined} defaultValue={value} required={required} maxLength={maxLength} minLength={type === "password" ? 12 : undefined} autoComplete={autoComplete ?? (type === "password" ? "new-password" : undefined)} /></label>; }
export function TextField({ name, label, value, maxLength = 3000, required = true }: { name: string; label: string; value?: string; maxLength?: number; required?: boolean }) { return <label className="block text-sm font-medium">{label}<textarea name={name} defaultValue={value} required={required} maxLength={maxLength} rows={3} className={inputClass} /></label>; }
export function CategoryField({ value }: { value?: string }) { return <label className="block text-sm font-medium">Service category<select name="category" defaultValue={value} className={inputClass}>{SERVICE_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>; }
export function ProfileFields({ profile }: { profile?: { businessName: string; category: string; location: string; bio: string; portfolioUrl: string | null; available: boolean } }) { return <><Field name="businessName" label="Business or trading name" value={profile?.businessName} maxLength={120} /><CategoryField value={profile?.category} /><Field name="location" label="Location / area served" value={profile?.location} /><TextField name="bio" label="About your services and experience" value={profile?.bio} /><Field name="portfolioUrl" label="Portfolio website (HTTPS, optional)" type="url" required={false} value={profile?.portfolioUrl ?? ""} maxLength={1000} />{profile ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="available" defaultChecked={profile.available} />Available for new jobs</label> : null}</>; }
export function ProviderPresence() {
  useEffect(() => { const ping = () => { if (document.visibilityState === "visible") void providerHeartbeat().catch(() => {}); }; ping(); const timer = setInterval(ping, 60_000); document.addEventListener("visibilitychange", ping); return () => { clearInterval(timer); document.removeEventListener("visibilitychange", ping); }; }, []);
  return null;
}
