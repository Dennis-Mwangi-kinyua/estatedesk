"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BellRing, ExternalLink, Phone, X } from "lucide-react";
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
    <section className="fixed inset-x-3 top-20 z-[120] mx-auto max-w-xl rounded-xl border border-amber-200 bg-white p-4 text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:right-5 sm:left-auto sm:mx-0 sm:w-[420px]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
          <BellRing className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                New vacancy enquiry
              </p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
                {latest.fullName} wants a vacant house
              </h2>
            </div>

            <button
              type="button"
              onClick={() => dismiss(latest.id)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Dismiss vacancy enquiry alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {latest.propertyName}, Unit {latest.unitLabel}
            {latest.propertyLocation ? ` · ${latest.propertyLocation}` : ""}
          </p>
          <p className="mt-2 line-clamp-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
            {latest.message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
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

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a
              href={`tel:${latest.phone}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
            <Link
              href={`/dashboard/org/units/${latest.unitId}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              View unit
            </Link>
          </div>

          {visibleInquiries.length > 1 ? (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                {visibleInquiries.length - 1} more new enquiry
                {visibleInquiries.length - 1 === 1 ? "" : "ies"}
              </p>
              <button
                type="button"
                onClick={dismissAll}
                className="text-xs font-semibold text-slate-700 transition hover:text-slate-950"
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
