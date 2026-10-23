import { useState } from "react";
import Link from "@/components/navigation/workspace-link";
import { AlertTriangle, Check, Copy, RefreshCw } from "lucide-react";

export function ErrorState({ title = "This page could not load", description = "Please try again. If the problem continues, contact support with the reference below.", reference, supportInstructions, retry, homeHref = "/", homeLabel = "Go home" }: { title?: string; description?: string; reference?: string; supportInstructions?: string; retry: () => void; homeHref?: string; homeLabel?: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copyReference() {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const field = document.createElement("textarea");
      field.value = reference;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const success = document.execCommand("copy");
      field.remove();
      setCopied(success);
      setCopyFailed(!success);
      if (success) window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex min-h-[50dvh] items-center justify-center p-4">
      <section role="alert" className="system-glass-card w-full max-w-lg rounded-3xl border border-border p-5 text-foreground sm:p-8">
        <span className="inline-flex rounded-2xl bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300"><AlertTriangle aria-hidden="true" className="h-6 w-6" /></span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        {reference && <div className="mt-4 rounded-xl border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Error reference (for support)</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{reference}</code>
            <button type="button" onClick={copyReference} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold" aria-label="Copy error reference">
              {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          {copyFailed && <p role="status" className="mt-2 text-xs text-muted-foreground">Copy was blocked by your browser. Select the reference above and copy it manually.</p>}
        </div>}
        {supportInstructions && <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-foreground">What to do next</p>
          <p className="mt-1">{supportInstructions}</p>
        </div>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button data-workspace-action="true" type="button" onClick={retry} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><RefreshCw aria-hidden="true" className="h-4 w-4" />Try again</button>
          <Link data-workspace-action="true" href={homeHref} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold">{homeLabel}</Link>
        </div>
      </section>
    </div>
  );
}
