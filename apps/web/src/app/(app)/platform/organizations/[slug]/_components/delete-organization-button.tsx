"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, Trash2 } from "lucide-react";

export function DeleteOrganizationButton() {
  const { pending } = useFormStatus();
  return <><button type="submit" data-workspace-action="true" disabled={pending} aria-busy={pending}
    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 sm:w-auto">
    {pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}
    <span>{pending ? "Deleting…" : "Delete organization"}</span>
  </button><span className="sr-only" role="status" aria-live="polite">{pending ? "Deleting…" : ""}</span></>;
}
