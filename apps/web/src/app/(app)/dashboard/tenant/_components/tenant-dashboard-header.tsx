import { WorkspaceHero } from "@/components/shared/workspace-hero";
import Link from "next/link";
import {
  BellRing as Bell,
  WalletCards as CreditCard,
  FileText,
  MapPin,
  MessageSquareText,
  WalletCards,
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
    <section data-workspace-header className={panelShellClassName}>
      <WorkspaceHero kind="tenant" eyebrow="Your tenant workspace" title={`Welcome back, ${fullName}`} description={summary} actions={<>
          <Link data-workspace-action="true" href="/dashboard/tenant/payments" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><CreditCard className="h-4 w-4" />{showPayNow ? "Pay outstanding balance" : "View payments"}</Link>
          <Link data-workspace-action="true" href="/dashboard/tenant/lease" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium"><FileText className="h-4 w-4" />My lease</Link>
          <Link data-workspace-action="true" href="/dashboard/tenant/issues/report" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium"><Wrench className="h-4 w-4" />Report issue</Link>
        </>}>
          <div className="flex flex-wrap items-center gap-2 text-xs"><span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{location || "No unit assigned"}</span><StatusPill status={leaseStatus} /><span className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-muted-foreground">{organizationName}</span></div>
          <InAppGuideHint topic="rent" workspace="tenant" />
        </WorkspaceHero>

      <div className="tenant-summary-grid ed-keep-cols grid grid-cols-2 gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:grid-cols-4">
        <Link href="/dashboard/tenant/lease" className="workspace-metric group min-w-0 rounded-2xl border border-border bg-muted/10 p-3 transition hover:border-primary/30 hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4">
          <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">Monthly rent</p><WalletCards className="size-4 shrink-0 text-primary" aria-hidden="true" /></div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(monthlyRent as never)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Due day {dueDay ?? "—"}
          </p>
        </Link>
        <Link href="/dashboard/tenant/payments" className="workspace-metric group min-w-0 rounded-2xl border border-border bg-muted/10 p-3 transition hover:border-primary/30 hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4">
          <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">Balance</p><CreditCard className="size-4 shrink-0 text-primary" aria-hidden="true" /></div>
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
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {portalContext.paymentHealth?.paymentStatus ?? "No ledger data"}
          </p>
        </Link>
        <Link href="/dashboard/tenant/issues" className="workspace-metric group min-w-0 rounded-2xl border border-border bg-muted/10 p-3 transition hover:border-primary/30 hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4">
          <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">Open requests</p><MessageSquareText className="size-4 shrink-0 text-primary" aria-hidden="true" /></div>
          <p
            className={`mt-2 text-2xl font-semibold ${
              openIssuesCount > 0
                ? "text-amber-700 dark:text-amber-200"
                : "text-foreground"
            }`}
          >
            {openIssuesCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Maintenance in progress
          </p>
        </Link>
        <Link href="/dashboard/tenant/notifications" className="workspace-metric group min-w-0 rounded-2xl border border-border bg-muted/10 p-3 transition hover:border-primary/30 hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-4">
          <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">Notifications</p><Bell className="size-4 shrink-0 text-primary" aria-hidden="true" /></div>
          <p
            className={`mt-2 text-2xl font-semibold ${
              unreadNotificationCount > 0
                ? "text-amber-700 dark:text-amber-200"
                : "text-foreground"
            }`}
          >
            {unreadNotificationCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Unread updates</p>
        </Link>
      </div>
    </section>
  );
}
