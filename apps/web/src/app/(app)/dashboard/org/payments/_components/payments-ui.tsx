import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
export const panelShellClassName =
  "workspace-panel min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm";

export const fieldClassName =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20";

export const compactFieldClassName =
  "min-h-11 min-w-0 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20";

export const buttonPrimaryClassName =
  "inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90";

export const buttonSecondaryClassName =
  "inline-flex min-h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30";

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
    <div className="workspace-metric flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs font-medium leading-5 text-muted-foreground">
        <VisualSticker label={label} size="xs" />{label}
      </p>
      <p className={`mt-3 break-words text-2xl font-semibold tabular-nums ${valueClassName}`}>{value}</p>
      {note ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

export {
  formatStatus,
  getTransactionMessage,
  reconciliationClasses,
  statusClasses,
} from "../_lib/helpers";