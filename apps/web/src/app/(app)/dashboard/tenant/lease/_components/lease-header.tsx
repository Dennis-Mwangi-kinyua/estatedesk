import Link from "next/link";
import { ArrowLeft, CreditCard, Download, FileText } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import { isPdfLeaseAsset, tenantLeaseDownloadPath } from "../_lib/download";
import type { TenantLeasePageData } from "../_lib/types";
import { panelShellClassName } from "./leases-ui";

export function LeaseHeader({
  data,
}: {
  data: TenantLeasePageData;
}) {
  const activeLease = data.latestLease;
  const contractDocument = activeLease?.contractDocument;
  const hasPdfContract =
    Boolean(contractDocument?.key) && isPdfLeaseAsset(contractDocument!);

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Tenancy records
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              My lease
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Review your current tenancy, download the lease contract, track
              recent rent charges, and browse previous lease records in one place.
            </p>

            <InAppGuideHint topic="rent" workspace="tenant" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <Link
              href="/dashboard/tenant"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <Link
              href="/dashboard/tenant/payments"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <CreditCard className="h-4 w-4" />
              View payments
            </Link>
            {activeLease && hasPdfContract ? (
              <a
                href={tenantLeaseDownloadPath(activeLease.id)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Download lease PDF
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}