import Link from "next/link";
import { Download, FileText, Home, Wallet } from "lucide-react";
import {
  formatLedgerCurrency,
  formatLedgerDate,
} from "@/lib/ledger";
import {
  isPdfLeaseAsset,
  tenantLeaseDownloadPath,
} from "../../lease/_lib/download";
import type { TenantProfilePageData } from "../_lib/types";
import { panelShellClassName, SummaryMetric } from "./profile-ui";

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function TenancySummarySection({
  tenant,
  paymentHealth,
}: Pick<TenantProfilePageData, "tenant" | "paymentHealth">) {
  const activeLease = tenant.leases[0];

  if (!activeLease) {
    return (
      <section className={`${panelShellClassName} p-4 sm:p-5`}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Tenancy
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          No active unit
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Lease and payment actions appear once a new house is assigned.
        </p>
        <Link
          href="/dashboard/tenant/lease"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
        >
          View lease history
        </Link>
      </section>
    );
  }

  const unitLabel = [
    activeLease.unit.property.name,
    activeLease.unit.building?.name ?? null,
    `Unit ${activeLease.unit.houseNo}`,
  ]
    .filter(Boolean)
    .join(" / ");

  const showPayNow =
    paymentHealth &&
    paymentHealth.tone !== "settled" &&
    Number(paymentHealth.deficit ?? 0) > 0;
  const hasLeasePdf =
    Boolean(activeLease.contractDocument?.key) &&
    isPdfLeaseAsset(activeLease.contractDocument!);

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Current tenancy
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">{unitLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{tenant.org.name}</p>
      </div>

      <div className="grid gap-3 p-4 sm:p-5">
        <SummaryMetric
          label="Monthly rent"
          value={formatMoney(activeLease.monthlyRent)}
        />
        <SummaryMetric
          label="Deposit"
          value={formatMoney(activeLease.deposit)}
        />
        <SummaryMetric
          label="Due day"
          value={`Day ${activeLease.dueDay}`}
        />
        <SummaryMetric label="Lease status" value={activeLease.status} />
      </div>

      {paymentHealth ? (
        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground sm:px-5">
          <span className="font-medium text-foreground">
            {paymentHealth.paymentStatus}
          </span>
          {" · "}
          Balance {formatLedgerCurrency(paymentHealth.deficit)}
          {paymentHealth.oldestDueDate
            ? ` · due ${formatLedgerDate(paymentHealth.oldestDueDate)}`
            : ""}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-border p-4 sm:p-5">
        {showPayNow ? (
          <Link
            href="/dashboard/tenant/payments"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Wallet className="h-4 w-4" />
            Pay now
          </Link>
        ) : null}
        {hasLeasePdf ? (
          <a
            href={tenantLeaseDownloadPath(activeLease.id)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            <Download className="h-4 w-4" />
            Download lease PDF
          </a>
        ) : null}
        <Link
          href="/dashboard/tenant/lease"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
        >
          <FileText className="h-4 w-4" />
          View lease
        </Link>
        <Link
          href="/dashboard/tenant"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
        >
          <Home className="h-4 w-4" />
          Back to overview
        </Link>
      </div>
    </section>
  );
}