import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import type { ChargeStatus } from "@prisma/client";
import { formatChargeStatus, getChargeStatusClasses } from "../_lib/helpers";

export const panelShellClassName =
  "workspace-panel min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm";

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
    <div className="workspace-metric h-full min-w-0 rounded-2xl border border-border bg-card p-4">
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

export function ChargeStatusPill({ status }: { status: ChargeStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${getChargeStatusClasses(status)}`}
    >
      {formatChargeStatus(status)}
    </span>
  );
}