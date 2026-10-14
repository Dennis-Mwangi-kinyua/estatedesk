"use client";
import { useActionState } from "react";
import { guestLogin, submitGuestRequest } from "./actions";
export function GuestForm({ request = false }: { request?: boolean }) {
  const [state, action, pending] = useActionState(request ? submitGuestRequest : guestLogin, {});
  return <form action={action} className="space-y-4"><label className="block space-y-2"><span>{request ? "How can your host help?" : "Guest access code"}</span>{request ? <textarea className="w-full rounded-xl border bg-background p-3 text-base" name="message" required minLength={5} maxLength={2000} rows={4} /> : <input className="min-h-12 w-full rounded-xl border bg-background px-3 text-base" name="code" type="password" required maxLength={100} autoComplete="off" />}</label>{state.error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{state.error}</p>}{state.message && <p role="status" className="text-sm">{state.message}</p>}<button disabled={pending} className="min-h-11 rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground">{pending ? "Please wait…" : request ? "Send request" : "Access my stay"}</button></form>;
}
