import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ tenantId: string }>;
};

export default async function EditTenantPage({ params }: PageProps) {
  const { tenantId } = await params;
  redirect(`/dashboard/org/tenants/${tenantId}`);
}