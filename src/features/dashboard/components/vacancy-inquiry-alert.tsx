"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BellRing, ExternalLink, Phone, X } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import type { VacancyInquiryAlert } from "@/features/dashboard/server/get-vacancy-inquiry-alerts";

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function VacancyInquiryAlert({
  inquiries,
  orgId,
}: {
  inquiries: VacancyInquiryAlert[];
  orgId: string;
}) {
  const storageKey = `estatedesk:v1:vacancy-inquiries-dismissed:${orgId}`;
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();

    try {
      return new Set(JSON.parse(window.sessionStorage.getItem(storageKey) ?? "[]"));
    } catch {
      return new Set();
    }
  });

  const visibleInquiries = useMemo(
    () => inquiries.filter((inquiry) => !dismissedIds.has(inquiry.id)),
    [dismissedIds, inquiries],
  );

  if (visibleInquiries.length === 0) return null;

  const latest = visibleInquiries[0];

  const dismiss = (id: string) => {
    setDismissedIds((current) => {
      const next = new Set(current);
      next.add(id);
      window.sessionStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const dismissAll = () => {
    const next = new Set(inquiries.map((inquiry) => inquiry.id));
    window.sessionStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
    setDismissedIds(next);
  };

  return (
    <section className="fixed inset-x-3 top-20 z-[120] mx-auto max-w-xl overflow-hidden rounded-3xl border border-amber-200 bg-card p-4 text-card-foreground shadow-lg dark:border-amber-500/30 sm:right-5 sm:left-auto sm:mx-0 sm:w-[420px]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <BellRing className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">
                New vacancy enquiry
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                {latest.fullName} wants a vacant house
              </h2>
            </div>

            <button
              type="button"
              onClick={() => dismiss(latest.id)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
              aria-label="Dismiss vacancy enquiry alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {latest.propertyName}, Unit {latest.unitLabel}
            {latest.propertyLocation ? ` · ${latest.propertyLocation}` : ""}
          </p>
          <p className="mt-2 line-clamp-3 rounded-2xl border border-border bg-muted/10 px-3 py-2 text-sm leading-6 text-foreground">
            {latest.message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(latest.createdAt)}</span>
            <span>•</span>
            <span>{latest.phone}</span>
            {latest.email ? (
              <>
                <span>•</span>
                <span className="truncate">{latest.email}</span>
              </>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <a
              href={`tel:${latest.phone}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
            <DeferredLink
              href={`/dashboard/org/units/${latest.unitId}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted/20"
            >
              <ExternalLink className="h-4 w-4" />
              View unit
            </DeferredLink>
            <Link
              href="/dashboard/org/vacancy-inquiries"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted/20"
            >
              Open desk
            </Link>
          </div>

          {visibleInquiries.length > 1 ? (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                {visibleInquiries.length - 1} more new enquiry
                {visibleInquiries.length - 1 === 1 ? "" : "ies"}
              </p>
              <button
                type="button"
                onClick={dismissAll}
                className="text-xs font-semibold text-foreground transition hover:text-primary"
              >
                Dismiss all
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}