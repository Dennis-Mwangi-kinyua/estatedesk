"use client";

import { panelShellClassName } from "../_lib/constants";
import type { FieldLabelProps, InfoCardProps, SectionTitleProps } from "../_lib/types";

export { panelShellClassName };

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function FieldLabel({ children, required }: FieldLabelProps) {
  return (
    <span className="mb-2 block text-sm font-medium text-foreground">
      {children} {required ? <span className="text-red-500">*</span> : null}
    </span>
  );
}

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
      {children}
    </div>
  );
}

export function WarningNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
      {children}
    </div>
  );
}