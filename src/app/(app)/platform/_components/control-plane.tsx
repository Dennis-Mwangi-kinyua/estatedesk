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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["pending", "queued", "trialing", "initiated", "partial", "draft"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    ["failed", "rejected", "disabled", "suspended", "cancelled", "expired", "past_due"].includes(
      status,
    )
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-700";
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
      {note ? <p className="mt-1 text-xs text-neutral-500">{note}</p> : null}
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
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        tone ?? "border-neutral-200 bg-neutral-50 text-neutral-700"
      }`}
    >
      {children}
    </span>
  );
}

export function AdminLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-neutral-950 underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-neutral-500">
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
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {from}-{to} of {formatNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={href(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-xl border border-neutral-200 px-3 py-2 font-medium ${
            page <= 1
              ? "pointer-events-none bg-neutral-50 text-neutral-300"
              : "bg-white text-neutral-800 hover:bg-neutral-50"
          }`}
        >
          Previous
        </Link>
        <span className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
          {page} / {totalPages}
        </span>
        <Link
          href={href(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`rounded-xl border border-neutral-200 px-3 py-2 font-medium ${
            page >= totalPages
              ? "pointer-events-none bg-neutral-50 text-neutral-300"
              : "bg-white text-neutral-800 hover:bg-neutral-50"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
