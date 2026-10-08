"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PendingAction = {
  form?: HTMLFormElement;
  submitter?: HTMLElement | null;
  link?: HTMLAnchorElement;
  message: string;
  destructive: boolean;
};
const destructiveLabel = /\b(delete|remove|permanently delete)\b/i;

export function DestructiveActionGuard() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bypass = useRef<HTMLFormElement | HTMLAnchorElement | null>(null);
  const origin = useRef<HTMLElement | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (bypass.current === form) { bypass.current = null; return; }
      const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
      const label = `${submitter?.textContent ?? ""} ${submitter?.getAttribute("aria-label") ?? ""}`;
      const message = submitter?.dataset.confirm ?? form.dataset.confirm ?? form.dataset.confirmDelete ?? submitter?.dataset.confirmDelete;
      if (!message && !destructiveLabel.test(label)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (dialogRef.current?.open) return;
      origin.current = submitter ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      setPending({ form, submitter, destructive: destructiveLabel.test(`${label} ${message ?? ""}`), message: message || "This action may permanently remove data and cannot always be undone. Are you sure you want to proceed?" });
    }
    function onClick(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-confirm]") : null;
      if (!link || !link.dataset.confirm) return;
      if (bypass.current === link) { bypass.current = null; return; }
      event.preventDefault(); event.stopImmediatePropagation();
      if (dialogRef.current?.open) return;
      origin.current = link;
      setPending({ link, message: link.dataset.confirm, destructive: false });
    }
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    if (pending && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [pending]);

  function cancel() {
    dialogRef.current?.close(); setPending(null); origin.current?.focus();
  }
  function proceed() {
    if (!pending) return;
    dialogRef.current?.close(); setPending(null);
    if (pending.link?.isConnected) {
      bypass.current = pending.link; pending.link.click();
    } else if (pending.form?.isConnected) {
      bypass.current = pending.form;
      const button = pending.submitter;
      if ((button instanceof HTMLButtonElement || button instanceof HTMLInputElement) && button.form === pending.form) pending.form.requestSubmit(button);
      else pending.form.requestSubmit();
    }
    bypass.current = null;
  }

  return <dialog ref={dialogRef} aria-labelledby="action-confirm-title" aria-describedby="action-confirm-description"
    onCancel={event => { event.preventDefault(); cancel(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm">
    <div className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${pending?.destructive ? "bg-red-500/10 text-red-600 dark:text-red-300" : "bg-primary/10 text-primary"}`}><AlertTriangle className="h-5 w-5" /></span>
        <div><h2 id="action-confirm-title" className="text-lg font-semibold">{pending?.destructive ? "Confirm deletion" : "Confirm action"}</h2>
          <p id="action-confirm-description" className="mt-2 text-sm leading-6 text-muted-foreground">{pending?.message}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button data-workspace-action="true" type="button" autoFocus onClick={cancel} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted">Cancel</button>
        <button data-workspace-action="true" type="button" onClick={proceed} className={`min-h-11 rounded-xl px-4 text-sm font-semibold text-white ${pending?.destructive ? "bg-red-600 hover:bg-red-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>{pending?.destructive ? "Delete" : "Continue"}</button>
      </div>
    </div>
  </dialog>;
}
