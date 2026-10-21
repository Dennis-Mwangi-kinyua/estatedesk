"use client";
import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ProviderActionState } from "./actions";
import { providerHeartbeat } from "./actions";
import { SERVICE_CATEGORIES } from "./policy";
export const inputClass = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground";
export const panelClass = "rounded-2xl border border-border bg-card p-5 sm:p-6";
export function ActionForm({ action, children, label = "Save", danger = false }: { action: (state: ProviderActionState, form: FormData) => Promise<ProviderActionState>; children?: ReactNode; label?: string; danger?: boolean }) {
  const [state, submit, pending] = useActionState(action, {});
  const router = useRouter();
  useEffect(() => { if (state.message) router.refresh(); }, [state, router]);
  return <form action={submit} className="space-y-3">{children}<button disabled={pending} className={`min-h-11 rounded-xl px-4 py-2 font-semibold disabled:opacity-60 ${danger ? "bg-red-600 text-white" : "bg-primary text-primary-foreground"}`}>{pending ? "Saving…" : label}</button>{state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}{state.message ? <p role="status" className="text-sm text-emerald-600 dark:text-emerald-300">{state.message}</p> : null}</form>;
}
export function Field({ name, label, value, type = "text", required = true, maxLength = 160, autoComplete }: { name: string; label: string; value?: string; type?: string; required?: boolean; maxLength?: number; autoComplete?: string }) { return <label className="block text-sm font-medium">{label}<input className={inputClass} name={name} type={type} step={["budget", "monthlyRent", "deposit"].includes(name) ? "0.01" : undefined} defaultValue={value} required={required} maxLength={maxLength} minLength={type === "password" ? 12 : undefined} autoComplete={autoComplete ?? (type === "password" ? "new-password" : undefined)} /></label>; }
export function TextField({ name, label, value, maxLength = 3000 }: { name: string; label: string; value?: string; maxLength?: number }) { return <label className="block text-sm font-medium">{label}<textarea name={name} defaultValue={value} required maxLength={maxLength} rows={3} className={inputClass} /></label>; }
export function CategoryField({ value }: { value?: string }) { return <label className="block text-sm font-medium">Service category<select name="category" defaultValue={value} className={inputClass}>{SERVICE_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>; }
export function ProfileFields({ profile }: { profile?: { businessName: string; category: string; location: string; bio: string; portfolioUrl: string | null; available: boolean } }) { return <><Field name="businessName" label="Business or trading name" value={profile?.businessName} maxLength={120} /><CategoryField value={profile?.category} /><Field name="location" label="Location / area served" value={profile?.location} /><TextField name="bio" label="About your services and experience" value={profile?.bio} /><Field name="portfolioUrl" label="Portfolio website (HTTPS, optional)" type="url" required={false} value={profile?.portfolioUrl ?? ""} maxLength={1000} />{profile ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="available" defaultChecked={profile.available} />Available for new jobs</label> : null}</>; }
export function ProviderPresence() {
  useEffect(() => { const ping = () => { if (document.visibilityState === "visible") void providerHeartbeat().catch(() => {}); }; ping(); const timer = setInterval(ping, 60_000); document.addEventListener("visibilitychange", ping); return () => { clearInterval(timer); document.removeEventListener("visibilitychange", ping); }; }, []);
  return null;
}
