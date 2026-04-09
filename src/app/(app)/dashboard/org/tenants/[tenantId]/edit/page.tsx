type PageProps = {
  params: Promise<{ tenantId: string }>;
};

export default async function EditTenantPage({ params }: PageProps) {
  const { tenantId } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Edit Tenant {tenantId}
      </h1>
    </div>
  );
}
