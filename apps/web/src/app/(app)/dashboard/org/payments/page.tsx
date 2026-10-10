import { RecordOrgPayment } from "@/features/charges/components/record-org-payment";
import { roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { requireOrgRole } from "@/lib/permissions/guards";
import { loadPaymentsPageData } from "./_lib/queries";
import type { PaymentsPageProps } from "./_lib/types";
import { PaymentsWorkspace } from "./_components/payments-workspace";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"]);

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const data = await loadPaymentsPageData(session.activeOrgId, q);

  return (
    <div className="space-y-4">
      {roleHasOrgPermission(session.activeOrgRole, "payments.verify") ? <RecordOrgPayment orgId={session.activeOrgId} /> : null}
      <PaymentsWorkspace data={data} orgRole={session.activeOrgRole} />
    </div>
  );
}