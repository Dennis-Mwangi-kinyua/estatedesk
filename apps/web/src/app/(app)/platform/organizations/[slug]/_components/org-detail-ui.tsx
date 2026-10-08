import { Activity, Bell, Building2, Droplets, Files, History, KeyRound, Mail, MessagesSquare, TriangleAlert, Users, Wallet, FileText, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {Status:Activity,Tenants:Users,Properties:Building2,"Recognized paid":Wallet,Members:Users,"API keys":KeyRound,Issues:TriangleAlert,Messages:MessagesSquare,Notifications:Bell,Assets:Files,"Water bills":Droplets,Leases:FileText,Invitations:Mail,"Audit records":History};
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
  const Icon = icons[label] ?? Activity;
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-col-reverse items-start gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-medium text-muted-foreground">{label}</p><Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" /></div>
      <p className="mt-1 text-lg font-semibold text-foreground">
        {formatNumber(value)}
      </p>
    </div>
  );
}
export function OrgSummaryCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  const Icon = icons[label] ?? Activity;
  return <div className="org-summary-card rounded-2xl border border-border bg-card p-3 sm:p-4"><Icon aria-hidden="true" className="h-5 w-5 text-primary"/><p className="mt-2 text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 break-words text-lg font-semibold tracking-tight text-foreground sm:text-2xl">{value}</p>{note && <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>}</div>;
}
