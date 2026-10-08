"use client";

import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

export function Field({
  label,
  required,
  error,
  children,
  name,
}: {
  name?: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = useId();
  function describeControls(nodes: ReactNode): ReactNode {
    return Children.map(nodes, (node) => {
      if (!isValidElement(node)) return node;
      const element = node as ReactElement<{ children?: ReactNode; "aria-describedby"?: string; "aria-invalid"?: boolean; "data-field"?: string }>;
      const control = typeof element.type === "string" && ["input", "select", "textarea"].includes(element.type);
      return cloneElement(element, {
        ...(control ? { "data-field": name, "aria-required": Boolean(required), "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined } : {}),
        ...(element.props.children ? { children: describeControls(element.props.children) } : {}),
      });
    });
  }
  return (
    <label className="block" data-invalid={Boolean(error)}>
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {describeControls(children)}
      {error ? <p id={errorId} role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
    </label>
  );
}

export function ReviewCard({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 dark:border-white/10"
          >
            <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
            <span className="min-w-0 break-words [overflow-wrap:anywhere] text-right text-sm font-medium text-slate-900 dark:text-slate-100">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

