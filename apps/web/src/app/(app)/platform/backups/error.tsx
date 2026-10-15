"use client";

import Link from "@/components/navigation/workspace-link";

export default function BackupsError({ reset }: { reset: () => void }) {
  return (
    <section className="engineering-workspace mx-auto max-w-7xl space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Backup and recovery</p>
      <h1 className="text-2xl font-semibold text-foreground">Backup information is temporarily unavailable</h1>
      <p role="status" className="max-w-2xl text-sm leading-6 text-muted-foreground">
        We could not load the recovery records. No backup or restore action has been performed. Retry the page or check system health for database connectivity.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Retry backup page</button>
        <Link href="/platform/system-health" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold">Check system health</Link>
      </div>
    </section>
  );
}
