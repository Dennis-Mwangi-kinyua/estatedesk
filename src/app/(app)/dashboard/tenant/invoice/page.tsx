import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { InvoiceWorkspace } from "./_components/invoice-workspace";
import { getTenantInvoiceData } from "./_lib/queries";

export default async function TenantInvoicePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const data = await getTenantInvoiceData(
    session.userId,
    session.activeOrgId,
    session.fullName,
  );

  return <InvoiceWorkspace data={data} />;
}