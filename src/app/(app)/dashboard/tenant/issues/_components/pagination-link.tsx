import Link from "next/link";
import type { ReactNode } from "react";

export function PaginationLink({
  page,
  currentPage,
  children,
  disabled = false,
}: {
  page: number;
  currentPage: number;
  children: ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-400">
        {children}
      </span>
    );
  }

  const active =
    page === currentPage
      ? "border-neutral-900 bg-neutral-900 text-white"
      : "border-border bg-card text-foreground/80 hover:bg-neutral-50";

  return (
    <Link
      href={`?page=${page}`}
      className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium ${active}`}
    >
      {children}
    </Link>
  );
}