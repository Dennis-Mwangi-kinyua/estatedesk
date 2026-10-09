import { DeferredLink } from "@/components/navigation/app-links";
import { formatStatus, getStatusClasses, getTenantDetails } from "../_lib/helpers";
import type { TenantRow } from "../_lib/types";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export const fieldClassName =
  "h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20";

export const buttonPrimaryClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90";

export const buttonSecondaryClassName =
  "inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30";

export function Notice({
  tone,
  children,
}: {
  tone: "success" | "warning";
  children: React.ReactNode;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200";

  return (
    <div className={`rounded-2xl border px-4 py-4 text-sm shadow-sm ${classes}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: number | string;
  note?: string;
  highlight?: "default" | "warning" | "success";
}) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value;

  const valueClassName =
    highlight === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : highlight === "success"
        ? "text-emerald-700 dark:text-emerald-200"
        : "text-foreground";

  return (
    <div className="min-w-0 rounded-2xl border border-border bg-muted/10 px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.1em] text-muted-foreground sm:text-xs sm:tracking-[0.14em]">
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold tabular-nums sm:mt-2 sm:text-2xl ${valueClassName}`}>
        {displayValue}
      </p>
      {note ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{note}</p>
      ) : null}
    </div>
  );
}

export function TenantStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(status)}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/20 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-5 text-foreground [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

export function TenantCard({
  tenant,
  currencyCode,
}: {
  tenant: TenantRow;
  currencyCode: string;
}) {
  const details = getTenantDetails(tenant, currencyCode);

  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition hover:border-ring hover:shadow-md sm:rounded-3xl sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
          {tenant.fullName.trim().slice(0, 1).toLocaleUpperCase() || "T"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
            <DeferredLink
              href={`/dashboard/org/tenants/${encodeURIComponent(tenant.slug ?? tenant.id)}`}
              className="min-w-0 flex-1 text-sm font-semibold leading-5 text-foreground hover:text-primary sm:text-base [overflow-wrap:anywhere]"
            >
              {tenant.fullName}
            </DeferredLink>
            <TenantStatusPill status={String(tenant.status)} />
          </div>
          <div className="mt-2 grid min-w-0 gap-1.5 text-xs leading-5 text-muted-foreground sm:grid-cols-2 sm:gap-x-4">
            <p className="min-w-0 [overflow-wrap:anywhere]">Phone: <span className="font-medium text-foreground">{tenant.phone || "Not provided"}</span></p>
            <p className="min-w-0 [overflow-wrap:anywhere]">Email: <span className="font-medium text-foreground">{tenant.email || "No email"}</span></p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
        <InfoLine label="Property" value={details.property} />
        <InfoLine label="Location" value={details.location} />
        <InfoLine label="Apartment" value={details.apartment} />
        <InfoLine label="Unit" value={`${details.unit} · ${details.unitType}`} />
        <InfoLine label="Caretaker" value={details.caretaker} />
        <InfoLine label="Lease" value={`${details.rent} · Due day ${details.dueDay}`} />
      </div>

      <DeferredLink
        href={`/dashboard/org/tenants/${encodeURIComponent(tenant.slug ?? tenant.id)}`}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:px-5"
      >
        View tenant
      </DeferredLink>
    </article>
  );
}
