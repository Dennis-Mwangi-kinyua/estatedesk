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
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${valueClassName}`}>
        {displayValue}
      </p>
      {note ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
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
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
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
    <DeferredLink
      href={`/dashboard/org/tenants/${tenant.id}`}
      className="block rounded-2xl border border-border bg-card p-4 transition hover:border-ring hover:bg-muted/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {tenant.fullName}
          </h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {tenant.phone} · {tenant.email ?? "No email"}
          </p>
        </div>

        <TenantStatusPill status={String(tenant.status)} />
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-muted/10 p-3">
        <InfoLine label="Property" value={details.property} />
        <InfoLine label="Location" value={details.location} />
        <InfoLine label="Apartment" value={details.apartment} />
        <InfoLine label="Unit" value={`${details.unit} · ${details.unitType}`} />
        <InfoLine label="Caretaker" value={details.caretaker} />
        <InfoLine label="Lease" value={`${details.rent} · Due day ${details.dueDay}`} />
      </div>
    </DeferredLink>
  );
}