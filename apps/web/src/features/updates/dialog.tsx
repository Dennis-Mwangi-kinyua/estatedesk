"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { acknowledgeProductUpdates } from "./actions";
import type { ProductUpdate, UpdateAudience } from "./catalog";

export function ProductUpdatesDialog({ audience, updates }: { audience: UpdateAudience; updates: ProductUpdate[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, submit, pending] = useActionState(acknowledgeProductUpdates, {});
  const router = useRouter();

  useEffect(() => {
    if (state.message) {
      dialogRef.current?.close();
      router.refresh();
    } else if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [state.message, router]);

  if (state.message) return null;
  return (
    <dialog ref={dialogRef} data-product-updates aria-labelledby="product-updates-title"
      onCancel={event => { event.preventDefault(); if (!pending) formRef.current?.requestSubmit(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl backdrop:bg-black/50 sm:p-6">
      <form ref={formRef} action={submit}>
        <input type="hidden" name="audience" value={audience} />
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="product-updates-title" className="text-xl font-semibold">What’s new in EstateDesk</h2><p className="mt-1 text-sm text-muted-foreground">New updates for your role. Close this to dismiss it permanently.</p></div>
          <button type="submit" disabled={pending} aria-label="Close what’s new" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground disabled:opacity-60"><X aria-hidden="true" className="h-5 w-5" /></button>
        </div>
        <ul className="mt-5 space-y-3">{updates.map(update => <li key={update.id} className="rounded-xl border border-border p-3"><h3 className="font-semibold">{update.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{update.description}</p></li>)}</ul>
        {state.error ? <p role="alert" className="mt-4 text-sm text-destructive">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="mt-5 min-h-11 w-full rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Closing…" : "Got it, don’t show again"}</button>
      </form>
    </dialog>
  );
}
