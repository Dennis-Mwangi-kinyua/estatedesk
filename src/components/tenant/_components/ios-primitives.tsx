"use client";

import Link from "next/link";
import { memo, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export const MobileEmoji = memo(function MobileEmoji({
  symbol,
  className = "",
}: {
  symbol: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-neutral-100 text-base ${className}`}
      aria-hidden="true"
    >
      {symbol}
    </span>
  );
});

export const IOSDivider = memo(function IOSDivider() {
  return <div className="ml-16 h-px bg-neutral-200 sm:ml-5" />;
});

export const IOSGroup = memo(function IOSGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section>
      {title ? (
        <p className="mb-2 px-4 text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground sm:px-1">
          {title}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[22px] ed-theme-card border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {children}
      </div>
    </section>
  );
});

export const IOSRow = memo(function IOSRow({
  label,
  value,
  href,
  emoji,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  emoji?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      {emoji ? (
        <div className="shrink-0 lg:hidden">
          <MobileEmoji symbol={emoji} />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-foreground">{label}</p>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div className="max-w-[180px] truncate text-right text-[15px] font-medium text-muted-foreground sm:max-w-none">
          {value}
        </div>
        {href ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block transition active:scale-[0.995] active:bg-neutral-50"
      >
        {content}
      </Link>
    );
  }

  return content;
});