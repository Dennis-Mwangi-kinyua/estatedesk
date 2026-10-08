import { MetricSticker } from "@/components/shared/metric-sticker";
import { formatNumber } from "../../../_components/control-plane";

export function InfoTile({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <p className="text-xs font-medium uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function SmallCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{label}</p><MetricSticker label={label} /></div>
      <p className="mt-1 text-lg font-semibold text-foreground">
        {formatNumber(value)}
      </p>
    </div>
  );
}