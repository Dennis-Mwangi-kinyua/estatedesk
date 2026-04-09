type PageProps = {
  params: Promise<{ tenantId: string }>;
};

export default async function TenantDetailsPage({ params }: PageProps) {
  const { tenantId } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Tenant {tenantId}
      </h1>
    </div>
  );
}
