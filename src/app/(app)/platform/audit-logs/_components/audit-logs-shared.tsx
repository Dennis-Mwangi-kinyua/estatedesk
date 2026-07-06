import { formatLabel } from "../_lib/helpers";

export function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

export function ActionBadge({ action }: { action: string }) {
  const normalized = action.toUpperCase();

  let styles =
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";

  if (
    normalized.includes("CREATE") ||
    normalized.includes("ADD") ||
    normalized.includes("GRANT") ||
    normalized.includes("APPROVE")
  ) {
    styles =
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  } else if (
    normalized.includes("DELETE") ||
    normalized.includes("REMOVE") ||
    normalized.includes("REVOKE") ||
    normalized.includes("SUSPEND")
  ) {
    styles =
      "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";
  } else if (
    normalized.includes("UPDATE") ||
    normalized.includes("EDIT") ||
    normalized.includes("CHANGE")
  ) {
    styles =
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {formatLabel(action)}
    </span>
  );
}

export function MiniBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
      {children}
    </span>
  );
}