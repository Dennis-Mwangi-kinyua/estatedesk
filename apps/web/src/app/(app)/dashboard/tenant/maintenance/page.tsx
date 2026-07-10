import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function TenantMaintenancePage() {
  redirect("/dashboard/tenant/issues");
}