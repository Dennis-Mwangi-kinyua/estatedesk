"use client";
import { useActionState, useId, useState } from "react";
import { changeAccountPasswordAction, type AccountPasswordState } from "../password-action";

export function AccountPasswordForm() {
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [state, action, pending] = useActionState(async (previous: AccountPasswordState, form: FormData) => {
    const result = await changeAccountPasswordAction(previous, form);
    if (result.ok) setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
    return result;
  }, { ok: false });
  const id = useId();
  return <form action={action} className="space-y-4">
    <div><h2 className="text-lg font-semibold">Change password</h2><p id={`${id}-help`} className="mt-2 text-sm leading-6 text-muted-foreground">Use a unique passphrase of at least 12 characters. Updating it signs out other devices and invalidates outstanding password-reset links. This device stays signed in.</p></div>
    {([["currentPassword", "Current password", "current-password"], ["newPassword", "New password", "new-password"], ["confirmPassword", "Confirm new password", "new-password"]] as const).map(([name, label, autoComplete]) => <div key={name} className="space-y-2"><label htmlFor={`${id}-${name}`} className="block text-sm font-medium">{label}</label><input id={`${id}-${name}`} name={name} value={values[name]} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))} type="password" autoComplete={autoComplete} required minLength={name === "currentPassword" ? 1 : 12} maxLength={1024} disabled={pending} aria-describedby={`${id}-help`} className="min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-base" /></div>)}
    {state.error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p> : null}
    {state.ok && state.message ? <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">{state.message}</p> : null}
    <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto">{pending ? "Updating password…" : "Update password securely"}</button>
  </form>;
}
