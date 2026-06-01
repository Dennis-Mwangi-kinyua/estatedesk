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

  if (["active", "sent", "success", "verified", "paid", "enabled"].includes(status)) {
    return "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";
  }

  if (["pending", "queued", "trialing", "initiated", "partial", "draft"].includes(status)) {
    return "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";
  }

  if (
    ["failed", "rejected", "disabled", "suspended", "cancelled", "expired", "past_due"].includes(
      status,
    )
  ) {
    return "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";
  }

  return "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
        {value}
      </p>
      {note ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{note}</p> : null}
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
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="border-b border-slate-100 px-4 py-4 dark:border-white/10">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        tone ?? "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
      }`}
    >
      {children}
    </span>
  );
}

export function AdminLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-slate-950 underline-offset-4 hover:underline dark:text-white">
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
