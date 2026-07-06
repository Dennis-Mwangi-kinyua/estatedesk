import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { PageShell } from "@/components/theme/ed-dashboard-shell";
import type { TenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";
import { PendingSignatureBanner } from "../../_components/pending-signature-banner";
import type { TenantLeasePageData } from "../_lib/types";
import { ActiveLeasePanel } from "./active-lease-panel";
import { LeaseGuidance } from "./lease-guidance";
import { LeaseHeader } from "./lease-header";
import { LeaseHistorySection } from "./lease-history-section";
import { LeaseOfficeContactPanel } from "./lease-office-contact-panel";
import { LeaseStats } from "./lease-stats";
import { LeaseVerificationPanel } from "./lease-verification-panel";
import { panelShellClassName } from "./leases-ui";

export function LeaseWorkspace({
  data,
  portalContext,
}: {
  data: TenantLeasePageData;
  portalContext: TenantPortalContext;
}) {
  const { tenant, activeLeases, historicalLeases, latestLease } = data;

  if (!tenant || tenant.leases.length === 0) {
    return (
      <PageShell>
        <section className={`${panelShellClassName} p-8 text-center`}>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            My lease
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No lease records found for your account.
          </p>
          <div className="mt-4">
            <InAppGuideLink topic="rent" workspace="tenant" />
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {portalContext.pendingLeaseSignatures.length > 0 ? (
        <PendingSignatureBanner
          pendingSignatures={portalContext.pendingLeaseSignatures}
        />
      ) : null}

      <LeaseHeader data={data} />
      <LeaseStats data={data} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          {latestLease && activeLeases.length > 0 ? (
            <ActiveLeasePanel lease={latestLease} />
          ) : (
            <section className={`${panelShellClassName} p-6`}>
              <h2 className="text-lg font-semibold text-foreground">
                No active lease
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You do not currently have an active tenancy on file. Previous
                lease records are listed below when available.
              </p>
            </section>
          )}

          {activeLeases.length > 1
            ? activeLeases.slice(1).map((lease) => (
                <ActiveLeasePanel key={lease.id} lease={lease} />
              ))
            : null}

          <LeaseHistorySection leases={historicalLeases} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <LeaseGuidance />
          <LeaseVerificationPanel
            leaseDocuments={portalContext.leaseDocuments}
          />
          <LeaseOfficeContactPanel portalContext={portalContext} />
        </aside>
      </div>
    </PageShell>
  );
}