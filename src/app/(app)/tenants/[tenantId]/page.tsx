import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TenantLegacyRedirectPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  redirect(`/dashboard/org/tenants/${tenantId}`);
}
