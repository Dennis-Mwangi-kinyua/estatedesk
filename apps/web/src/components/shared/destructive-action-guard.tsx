"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PendingSubmit = {
  form: HTMLFormElement;
  submitter: HTMLElement | null;
};

const destructiveLabel = /\b(delete|remove|permanently delete)\b/i;

export function DestructiveActionGuard() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bypassForm = useRef<HTMLFormElement | null>(null);
  const [pending, setPending] = useState<PendingSubmit | null>(null);

  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      if (bypassForm.current === form) {
        bypassForm.current = null;
        return;
      }

      const submitter = event.submitter;
      const label =
        submitter instanceof HTMLElement
          ? `${submitter.textContent ?? ""} ${submitter.getAttribute("aria-label") ?? ""}`
          : "";
      const confirmation =
        form.dataset.confirmDelete ??
        (submitter instanceof HTMLElement
          ? submitter.dataset.confirmDelete
          : undefined);

      if (!confirmation && !destructiveLabel.test(label)) return;

      event.preventDefault();
      setPending({
        form,
        submitter: submitter instanceof HTMLElement ? submitter : null,
      });
      dialogRef.current?.showModal();
    }

    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  function cancel() {
    dialogRef.current?.close();
    setPending(null);
  }

  function proceed() {
    if (!pending) return;
    const { form, submitter } = pending;
    bypassForm.current = form;
    dialogRef.current?.close();
    setPending(null);

    if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
      form.requestSubmit(submitter);
    } else {
      form.requestSubmit();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/60 dark:border-white/15 dark:bg-slate-900 dark:text-white"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Confirm deletion</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              This action may permanently remove data and cannot always be undone. Are you sure you want to proceed?
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={cancel} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
            Cancel
          </button>
          <button type="button" onClick={proceed} className="h-10 rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
            Proceed
          </button>
        </div>
      </div>
    </dialog>
  );
}
