"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorState({ title = "This page could not load", description = "Please try again. If the problem continues, contact support with the reference below.", reference, retry, homeHref = "/", homeLabel = "Go home" }: { title?: string; description?: string; reference?: string; retry: () => void; homeHref?: string; homeLabel?: string }) {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center p-4">
      <section role="alert" className="system-glass-card w-full max-w-lg rounded-3xl border border-border p-5 text-foreground sm:p-8">
        <span className="inline-flex rounded-2xl bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300"><AlertTriangle aria-hidden="true" className="h-6 w-6" /></span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        {reference && <p className="mt-4 break-all rounded-xl border border-border p-3 font-mono text-xs text-muted-foreground">Reference: {reference}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button data-workspace-action="true" type="button" onClick={retry} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><RefreshCw aria-hidden="true" className="h-4 w-4" />Try again</button>
          <Link data-workspace-action="true" href={homeHref} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold">{homeLabel}</Link>
        </div>
      </section>
    </div>
  );
}
