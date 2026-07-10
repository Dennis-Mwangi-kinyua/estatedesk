import Link from "next/link";
import {
  CreditCard,
  FileText,
  Home,
  MapPin,
  Wrench,
} from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { formatCurrency } from "@/lib/tenant/tenant-format";
import type { TenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";
import { panelShellClassName, StatusPill } from "./tenant-dashboard-ui";

type TenantDashboardHeaderProps = {
  fullName: string;
  organizationName: string;
  propertyName?: string | null;
  buildingName?: string | null;
  houseNo?: string | null;
  leaseStatus?: string | null;
  monthlyRent?: unknown;
  dueDay?: number | null;
  openIssuesCount: number;
  unreadNotificationCount: number;
  portalContext: TenantPortalContext;
};

function buildSummary(input: {
  openIssuesCount: number;
  unreadNotificationCount: number;
  paymentHealth: TenantPortalContext["paymentHealth"];
  pendingSignatures: number;
}) {
  const parts: string[] = [];

  if (input.paymentHealth && input.paymentHealth.tone !== "settled") {
    parts.push(input.paymentHealth.paymentStatus.toLowerCase());
  }

  if (input.pendingSignatures > 0) {
    parts.push(
      `${input.pendingSignatures} lease signature${input.pendingSignatures === 1 ? "" : "s"} pending`,
    );
  }

  if (input.openIssuesCount > 0) {
    parts.push(
      `${input.openIssuesCount} open maintenance request${input.openIssuesCount === 1 ? "" : "s"}`,
    );
  }

  if (input.unreadNotificationCount > 0) {
    parts.push(
      `${input.unreadNotificationCount} unread notification${input.unreadNotificationCount === 1 ? "" : "s"}`,
    );
  }

  if (parts.length === 0) {
    return "Your tenancy, payments, and requests are up to date.";
  }

  return `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)}${parts.length > 1 ? ` • ${parts.slice(1).join(" • ")}` : ""}.`;
}

export function TenantDashboardHeader({
  fullName,
  organizationName,
  propertyName,
  buildingName,
  houseNo,
  leaseStatus,
  monthlyRent,
  dueDay,
  openIssuesCount,
  unreadNotificationCount,
  portalContext,
}: TenantDashboardHeaderProps) {
  const location = [
    propertyName,
    buildingName,
    houseNo ? `Unit ${houseNo}` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  const showPayNow =
    portalContext.paymentHealth &&
    portalContext.paymentHealth.tone !== "settled" &&
    Number(portalContext.paymentHealth.deficit ?? 0) > 0;

  const summary = buildSummary({
    openIssuesCount,
    unreadNotificationCount,
    paymentHealth: portalContext.paymentHealth,
    pendingSignatures: portalContext.pendingLeaseSignatures.length,
  });

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Home className="h-3.5 w-3.5" />
              Overview
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {fullName}
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {location || "No unit assigned"}
              </span>
              <StatusPill status={leaseStatus} />
              <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
                {organizationName}
              </span>
            </div>

            <InAppGuideHint topic="rent" workspace="tenant" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:min-w-[240px] xl:flex-col">
            {showPayNow ? (
              <Link
                href="/dashboard/tenant/payments"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <CreditCard className="h-4 w-4" />
                Pay outstanding balance
              </Link>
            ) : (
              <Link
                href="/dashboard/tenant/payments"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <CreditCard className="h-4 w-4" />
                View payments
              </Link>
            )}
            <Link
              href="/dashboard/tenant/lease"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <FileText className="h-4 w-4" />
              My lease
            </Link>
            <Link
              href="/dashboard/tenant/issues/report"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <Wrench className="h-4 w-4" />
              Report issue
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Monthly rent
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(monthlyRent as never)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Due day {dueDay ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Balance
          </p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              portalContext.paymentHealth?.tone === "settled"
                ? "text-foreground"
                : "text-amber-700 dark:text-amber-200"
            }`}
          >
            {portalContext.paymentHealth
              ? formatCurrency(portalContext.paymentHealth.deficit as never)
              : "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {portalContext.paymentHealth?.paymentStatus ?? "No ledger data"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Open requests
          </p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              openIssuesCount > 0
                ? "text-amber-700 dark:text-amber-200"
                : "text-foreground"
            }`}
          >
            {openIssuesCount}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Maintenance in progress
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Notifications
          </p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              unreadNotificationCount > 0
                ? "text-amber-700 dark:text-amber-200"
                : "text-foreground"
            }`}
          >
            {unreadNotificationCount}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Unread updates</p>
        </div>
      </div>
    </section>
  );
}