"use client";

import { useMemo, useState } from "react";
import {
  verifyMaintenanceQuote,
  type QuoteLineCheck,
} from "@/lib/vendors/price-index";

/**
 * Background check: compare a maintenance quote against the local material index
 * to flag caretaker/vendor overpricing before office approval.
 */
export function QuotePriceCheckPanel() {
  const [raw, setRaw] = useState(
    "Cement 50kg, 10, 900\nPVC pipe 1 inch, 4, 700\nEmulsion paint 20L, 2, 4800",
  );

  const lines: QuoteLineCheck[] = useMemo(() => {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        const description = parts[0] || "Item";
        const quantity = Number(parts[1] || 1) || 1;
        const unitPriceKes = Number(parts[2] || 0) || 0;
        return { description, quantity, unitPriceKes };
      });
  }, [raw]);

  const result = useMemo(
    () => (lines.length ? verifyMaintenanceQuote(lines) : null),
    [lines],
  );

  const statusTone =
    result?.overallStatus === "flag"
      ? "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100"
      : result?.overallStatus === "watch"
        ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
        : result?.overallStatus === "ok"
          ? "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"
          : "border-border bg-muted/20 text-muted-foreground";

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-foreground">
        Quote price index check
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
        Paste lines as <code className="text-[11px]">description, qty, unit price KES</code>.
        Flags prices above the local fair band to reduce caretaker/vendor fraud.
      </p>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Quote lines
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={5}
          className="mt-1.5 w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20"
        />
      </label>

      {result ? (
        <div className="mt-4 space-y-3">
          <div className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${statusTone}`}>
            {result.summary}
          </div>
          <p className="text-xs text-muted-foreground">
            Quote total:{" "}
            <span className="font-semibold text-foreground">
              KES {result.quoteTotal.toLocaleString("en-KE")}
            </span>
            {result.estimatedFairTotal != null ? (
              <>
                {" "}
                · Fair estimate:{" "}
                <span className="font-semibold text-foreground">
                  KES {result.estimatedFairTotal.toLocaleString("en-KE")}
                </span>
              </>
            ) : null}
          </p>
          <ul className="space-y-2">
            {result.lineResults.map((line) => (
              <li
                key={`${line.description}-${line.unitPriceKes}`}
                className="rounded-xl border border-border bg-muted/10 px-3 py-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {line.description}
                  </span>
                  <span className="shrink-0 uppercase tracking-wide text-muted-foreground">
                    {line.status}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Qty {line.quantity} · KES {line.unitPriceKes.toLocaleString("en-KE")}
                  {line.indexMax != null
                    ? ` · max fair ${line.indexMax.toLocaleString("en-KE")}`
                    : ""}
                </p>
                <p className="mt-0.5 text-muted-foreground">{line.note}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
