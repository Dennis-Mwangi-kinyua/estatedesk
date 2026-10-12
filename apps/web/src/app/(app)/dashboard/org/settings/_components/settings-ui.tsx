import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import type { ComponentType } from "react";
import { DeferredLink } from "@/components/navigation/app-links";

export const panelShellClassName =
  "workspace-panel min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm";

type IconType = ComponentType<{ className?: string }>;

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
  icon?: IconType;
}) {
  const valueClassName =
    highlight === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : highlight === "success"
        ? "text-emerald-700 dark:text-emerald-200"
        : "text-foreground";

  return (
    <div className="h-full min-w-0 rounded-2xl border border-border bg-card p-4">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium leading-5 text-muted-foreground">
            <VisualSticker label={label} size="xs" />{label}
          </p>
          <p className={`mt-3 break-words text-2xl font-semibold ${valueClassName}`}>
            {value}
          </p>
          {note ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
          ) : null}
        </div>

      </div>
    </div>
  );
}

export function SettingsNavCard({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: IconType;
}) {
  return (
    <DeferredLink
      href={href}
      className="group flex h-full min-w-0 min-h-32 items-start rounded-2xl border border-border bg-muted/10 p-4 shadow-sm transition sm:p-5 motion-safe:hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/15 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span className="flex min-w-0 items-start gap-3">
        <VisualSticker label={label} className="shrink-0" />
        <span className="min-w-0">
          <span className="flex items-start gap-2 text-sm font-semibold text-foreground">{label}<Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /></span>
          <span className="mt-2 block text-sm leading-6 text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
    </DeferredLink>
  );
}