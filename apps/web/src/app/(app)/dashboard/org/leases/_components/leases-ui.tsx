
import { VisualSticker } from "@/components/shared/visual-sticker";
import { getLeaseStatusClass } from "../_lib/helpers";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export function StatCard({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: string | number;
  note?: string;
  highlight?: "default" | "warning" | "success";
}) {
  const valueClassName =
    highlight === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : highlight === "success"
        ? "text-emerald-700 dark:text-emerald-200"
        : "text-foreground";

  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <VisualSticker label={label} size="xs" className="mb-2 mr-2" />{label}
      </p>
      <p className={`mt-2 break-words text-xl font-semibold sm:text-2xl ${valueClassName}`}>{value}</p>
      {note ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

export function LeaseStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getLeaseStatusClass(status)}`}
    >
      {status}
    </span>
  );
}