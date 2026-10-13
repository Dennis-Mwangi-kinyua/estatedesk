import { History, MessagesSquare, TriangleAlert, FileText, Globe2, Settings2, Receipt, type LucideIcon } from "lucide-react";
import { Activity, BellRing, Building2, Droplets, Files, KeyRound, Mail, UsersRound, Wallet, CalendarDays, Clock3, Phone, ShieldCheck, SlidersHorizontal } from "@/components/shared/colored-icons";
import type { ReactNode } from "react";
import { formatNumber } from "../../../_components/control-plane";

const icons: Record<string, LucideIcon> = {
  Status: Activity, Tenants: UsersRound, Properties: Building2, "Recognized paid": Wallet,
  Members: UsersRound, "API keys": KeyRound, Issues: TriangleAlert, Messages: MessagesSquare,
  Notifications: BellRing, Assets: Files, "Water bills": Droplets, Leases: FileText,
  Invitations: Mail, "Audit records": History, Slug: Building2, Timezone: Globe2,
  Currency: Wallet, Retention: History, Email: Mail, Phone, "Period start": CalendarDays,
  "Period end": CalendarDays, "Trial end": Clock3, "Billing email": Mail,
  "Workspace profile": Building2, "Billing and subscription": Wallet,
  "Feature flags": SlidersHorizontal, "KRA integration": ShieldCheck,
  "Operational counts": Settings2, "Recent payments": Receipt,
  "Recent members": UsersRound, "Recent audit activity": History, "Danger zone": TriangleAlert,
};

export function OrgSurface({ id, title, description, className = "", children }: {
  id?: string; title: string; description?: string; className?: string; children: ReactNode;
}) {
  const Icon = icons[title] ?? Activity;
  return <section id={id} className={`org-detail-panel workspace-panel scroll-mt-24 min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${className}`}>
    <div className="flex items-start gap-3 border-b border-border p-4 sm:p-5">
      <span className="org-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon aria-hidden="true" className="h-5 w-5" /></span>
      <div className="min-w-0"><h2 data-heading-icon="custom" className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      {description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}</div>
    </div>{children}
  </section>;
}

export function InfoTile({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  const Icon = icons[label] ?? FileText;
  return <div className="org-info-tile rounded-xl border border-border/60 bg-muted/15 p-3.5">
    <div className="flex items-center gap-2 text-muted-foreground"><span className="shrink-0">{icon ?? <Icon aria-hidden="true" className="h-4 w-4" />}</span><p className="text-xs font-medium">{label}</p></div>
    <p className="mt-2 break-words text-sm font-semibold leading-6 text-foreground">{value}</p>
  </div>;
}

export function SmallCount({ label, value }: { label: string; value: number }) {
  const Icon = icons[label] ?? Activity;
  return <div className="org-count-card flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 sm:p-4">
    <span className="org-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon aria-hidden="true" className="h-4 w-4" /></span>
    <div className="min-w-0"><p className="text-xl font-semibold tabular-nums tracking-tight text-foreground">{formatNumber(value)}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{label}</p></div>
  </div>;
}

export function OrgSummaryCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  const Icon = icons[label] ?? Activity;
  const tones: Record<string, string> = { Status: "emerald", Tenants: "blue", Properties: "teal", "Recognized paid": "amber" };
  return <div data-tone={tones[label]} className="org-summary-card relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><span className="org-metric-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"><Icon aria-hidden="true" className="h-5 w-5" /></span></div>
    <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</p>
    {note && <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>}
  </div>;
}
