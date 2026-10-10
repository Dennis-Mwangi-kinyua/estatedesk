import Link from "next/link";
import { Activity, BriefcaseBusiness, ChevronLeft, ChevronRight, Clock3, ContactRound, Landmark, Mail, Moon, Phone, ShieldCheck, UserRoundCog, UsersRound, Wrench } from "lucide-react";
import { ROLE_META, type StaffRole } from "@/features/staff/constants/role-meta";
import { DeferredLink } from "@/components/navigation/app-links";


const ROLE_ICONS = { ADMIN: ShieldCheck, MANAGER: UserRoundCog, OFFICE: BriefcaseBusiness, ACCOUNTANT: Landmark, CARETAKER: Wrench };

export function StaffRoleIcon({ role, className = "h-3.5 w-3.5" }: { role: StaffRole; className?: string }) {
  const Icon = ROLE_ICONS[role];
  return <Icon aria-hidden="true" className={`shrink-0 ${className}`} strokeWidth={1.75} />;
}

export const panelShellClassName =
  "min-w-0 overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export const panelBodyClassName = "p-4 sm:p-6";

export const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90";

export function RolePill({ role }: { role: StaffRole }) {
  const meta = ROLE_META[role];

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass} dark:border-border dark:bg-muted/20 dark:text-foreground`}
    >
      <StaffRoleIcon role={role} />
      {meta.label}
    </span>
  );
}

export function PresencePill({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        online
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border bg-muted/20 text-muted-foreground"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          online ? "bg-emerald-500" : "bg-muted-foreground/50"
        }`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}

export function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "success";
}) {
  const Icon = label === "Online now" ? Activity : label === "Offline" ? Moon : UsersRound;
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-muted/10 p-3 sm:p-4">
      <Icon aria-hidden="true" className={`mb-2 h-5 w-5 ${highlight === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-primary"}`} strokeWidth={1.75} />
      <p className="text-[11px] leading-4 text-muted-foreground sm:text-sm">{label}</p>
      <p
        className={`mt-1 break-words text-xl font-semibold tabular-nums sm:text-2xl ${
          highlight === "success"
            ? "text-emerald-600 dark:text-emerald-300"
            : "text-foreground"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export function StaffPagination({
  page,
  pageSize,
  total,
  basePath,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function href(nextPage: number) {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));
    return `${basePath}?${params.toString()}`;
  }

  const disabledClassName =
    "pointer-events-none border-border bg-muted/10 text-muted-foreground/50";
  const enabledClassName =
    "border-border bg-background text-foreground hover:bg-muted/20";

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>
        Showing {from}-{to} of {total.toLocaleString()}
      </p>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Link
          prefetch={false}
          href={href(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border px-3 py-2 font-medium sm:flex-none ${
            page <= 1 ? disabledClassName : enabledClassName
          }`}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4 shrink-0" />Previous
        </Link>
        <span className="shrink-0 rounded-xl border border-border bg-muted/10 px-3 py-2 text-xs tabular-nums text-foreground sm:text-sm">
          {page} / {totalPages}
        </span>
        <Link
          prefetch={false}
          href={href(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
          className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border px-3 py-2 font-medium sm:flex-none ${
            page >= totalPages ? disabledClassName : enabledClassName
          }`}
        >
          Next<ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        </Link>
      </div>
    </div>
  );
}

export function StaffCard({
  href,
  name,
  email,
  phone,
  role,
  online,
  lastSeen,
  status,
}: {
  href: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: StaffRole;
  online: boolean;
  lastSeen: string;
  status: string;
}) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
  return (
    <DeferredLink href={href} className="group block min-w-0 rounded-2xl border border-border bg-background p-4 transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-sm font-semibold text-foreground">{name}</p>
          <div className="mt-2"><RolePill role={role} /></div>
        </div>
        <ChevronRight aria-hidden="true" className="mt-3 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      </div>
      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        {email ? <p className="flex items-start gap-2"><Mail aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="min-w-0" style={{ overflowWrap: "anywhere" }}>{email}</span></p> : null}
        {phone ? <p className="flex items-center gap-2"><Phone aria-hidden="true" className="h-4 w-4 shrink-0" /><span>{phone}</span></p> : null}
        {!email && !phone ? <p className="flex items-center gap-2"><ContactRound aria-hidden="true" className="h-4 w-4 shrink-0" />No contact details</p> : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PresencePill online={online} />
        <span className="inline-flex rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">{status.toLowerCase().replaceAll("_", " ")}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /><span>Last seen {lastSeen}</span></p>
        <span className="inline-flex min-h-6 items-center gap-1 text-xs font-semibold text-primary">View profile<ChevronRight aria-hidden="true" className="h-3.5 w-3.5" /></span>
      </div>
    </DeferredLink>
  );
}
