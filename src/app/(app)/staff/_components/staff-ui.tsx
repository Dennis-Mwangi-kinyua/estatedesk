import { ROLE_META, type StaffRole } from "@/features/staff/constants/role-meta";
import { DeferredLink } from "@/components/navigation/app-links";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export const panelBodyClassName = "p-5 sm:p-6";

export const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90";

export function RolePill({ role }: { role: StaffRole }) {
  const meta = ROLE_META[role];

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badgeClass} dark:border-border dark:bg-muted/20 dark:text-foreground`}
    >
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
  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
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
      <div className="flex items-center gap-2">
        <DeferredLink
          href={href(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-xl border px-3 py-2 font-medium ${
            page <= 1 ? disabledClassName : enabledClassName
          }`}
        >
          Previous
        </DeferredLink>
        <span className="rounded-xl border border-border bg-muted/10 px-3 py-2 text-foreground">
          {page} / {totalPages}
        </span>
        <DeferredLink
          href={href(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`rounded-xl border px-3 py-2 font-medium ${
            page >= totalPages ? disabledClassName : enabledClassName
          }`}
        >
          Next
        </DeferredLink>
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
  return (
    <DeferredLink
      href={href}
      className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/30 hover:bg-muted/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {email ?? phone ?? "No contact"}
          </p>
        </div>
        <PresencePill online={online} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RolePill role={role} />
        <span className="inline-flex rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {status}
        </span>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Last seen
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{lastSeen}</p>
      </div>
    </DeferredLink>
  );
}