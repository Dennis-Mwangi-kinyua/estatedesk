"use client";
import { useActionState, useState } from "react";
import { KeyRound } from "lucide-react";
import Link from "@/components/navigation/workspace-link";
import { createSecurityAccount } from "./security-account-action";

export function SecurityAccountForm({ properties }: { properties: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createSecurityAccount, {});
  const [copyNotice, setCopyNotice] = useState("");
  const field = "mt-1 min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base text-foreground";
  return <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
    {state.credentials ? <div className="space-y-4"><h2 className="text-lg font-semibold">Security login created</h2><p className="text-sm leading-6 text-muted-foreground">Share these details with {state.credentials.fullName}. The temporary password is shown only in this creation session.</p><label className="block text-sm font-medium">Login details<textarea aria-label="Security login details" readOnly rows={6} className={`${field} leading-6`} value={`Name: ${state.credentials.fullName}\nUsername: ${state.credentials.username}\nTemporary password: ${state.credentials.password}\nSign in: ${state.credentials.loginUrl}\nChange your temporary password when you first sign in.`} /></label><div className="flex flex-col gap-3 sm:flex-row"><button type="button" className="min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground" onClick={async () => { try { await navigator.clipboard.writeText(`Name: ${state.credentials!.fullName}\nUsername: ${state.credentials!.username}\nTemporary password: ${state.credentials!.password}\nSign in: ${state.credentials!.loginUrl}`); setCopyNotice("Login details copied."); } catch { setCopyNotice("Select and copy the login details above."); } }}>Copy login details</button><Link href="/dashboard/gate" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold">Return to gate access</Link></div>{copyNotice && <p role="status" className="text-sm text-muted-foreground">{copyNotice}</p>}</div> : <>
      <div className="flex items-center gap-2"><KeyRound aria-hidden="true" className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Create security login</h2></div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">For your gate officer or subcontracted security staff. Create a login and assign the property they serve. A temporary password is generated for you.</p>
      <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm font-medium">Security officer name<input className={field} name="fullName" required minLength={2} maxLength={120} autoComplete="off" /></label>
        <label className="block text-sm font-medium">Security username<input className={field} name="username" required minLength={3} maxLength={30} autoComplete="off" autoCapitalize="none" spellCheck={false} /></label>
        <label className="block text-sm font-medium">Assigned property<select className={field} name="propertyId" required><option value="">Choose property</option>{properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}</select></label>
        <p className="text-sm leading-6 text-muted-foreground sm:col-span-2 lg:col-span-3">Security accounts can verify and admit visitors at assigned gates. They change their temporary password at first sign-in.</p>
        {state.error && <p role="alert" className="text-sm text-red-700 sm:col-span-2 lg:col-span-3 dark:text-red-300">{state.error}</p>}
        <button disabled={pending || !properties.length} className="min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2 lg:col-span-3">{pending ? "Creating login…" : "Create security account"}</button>
      </form>
    </>}
  </section>;
}
