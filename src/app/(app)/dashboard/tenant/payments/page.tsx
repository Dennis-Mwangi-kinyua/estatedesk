import { PageShell } from "@/components/theme/ed-dashboard-shell";
import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { EmptyState } from "@/app/(app)/dashboard/tenant/payments/_components/empty-state";
import { LedgerCard } from "@/app/(app)/dashboard/tenant/payments/_components/ledger-card";
import { ManualPaymentForm } from "@/app/(app)/dashboard/tenant/payments/_components/manual-payment-form";
import { PaymentsHeader } from "@/app/(app)/dashboard/tenant/payments/_components/payments-header";
import { PaymentsStats } from "@/app/(app)/dashboard/tenant/payments/_components/payments-stats";
import { RecentPayments } from "@/app/(app)/dashboard/tenant/payments/_components/recent-payments";
import { getTenantPaymentsData } from "@/app/(app)/dashboard/tenant/payments/_lib/queries";

export default async function TenantPaymentsPage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const data = await getTenantPaymentsData(
    session.userId,
    session.activeOrgId,
  );

  if (!data) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <PaymentsHeader data={data} />
        <ManualPaymentForm data={data} />
        <PaymentsStats data={data} />
        <LedgerCard data={data} />
        <RecentPayments data={data} />
      </div>
    </PageShell>
  );
}