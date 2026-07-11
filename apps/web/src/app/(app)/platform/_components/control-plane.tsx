import Link from "next/link";
import type { ReactNode } from "react";

export const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(value: Date | null | undefined) {
  if (!value) return "-";
  return dateTimeFormatter.format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export function labelize(value: string | null | undefined) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

export function toneForStatus(value: string | null | undefined) {
  const status = (value ?? "").toLowerCase();

  if (["active", "sent", "success", "verified", "paid", "enabled", "ready"].includes(status)) {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  }

  if (["pending", "queued", "trialing", "initiated", "partial", "draft", "check"].includes(status)) {
    return "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-100";
  }

  if (
    ["failed", "rejected", "disabled", "suspended", "cancelled", "expired", "past_due", "misconfigured"].includes(
      status,
    )
  ) {
    return "border-red-500/25 bg-red-500/10 text-red-800 dark:text-red-200";
  }

  return "border-border bg-muted/50 text-muted-foreground";
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header ios-panel rounded-xl border border-border bg-card/90 p-3 shadow-sm backdrop-blur-sm sm:p-5 lg:p-6">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground sm:mt-2">
            {description}
          </p>
        </div>
        {action ? (
          <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap lg:justify-end [&>*]:w-full [&>*]:justify-center sm:[&>*]:w-auto">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="ios-card rounded-xl border border-border bg-card/90 p-3 shadow-sm sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-2xl">
        {value}
      </p>
      {note ? <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{note}</p> : null}
    </div>
  );
}

export function Surface({
  title,
  children,
  description,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="ios-panel min-w-0 overflow-hidden rounded-xl border border-border bg-card/90 shadow-sm backdrop-blur-sm">
      <div className="border-b border-border px-3 py-3 sm:px-4 sm:py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        tone ?? "border-border bg-muted/60 text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

export function AdminLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-foreground underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-300">
        {label}
      </td>
    </tr>
  );
}

export function PaginationControls({
  page,
  pageSize,
  total,
  basePath,
  query,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query?: Record<string, string | number | null | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function href(nextPage: number) {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        params.set(key, String(value));
      }
    }

    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {from}-{to} of {formatNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={href(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-xl border border-slate-200 px-3 py-2 font-medium dark:border-white/10 ${
            page <= 1
              ? "pointer-events-none bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600"
              : "bg-white text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Previous
        </Link>
        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900">
          {page} / {totalPages}
        </span>
        <Link
          href={href(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`rounded-xl border border-slate-200 px-3 py-2 font-medium dark:border-white/10 ${
            page >= totalPages
              ? "pointer-events-none bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600"
              : "bg-white text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
