import { requireTenantAccess } from "@/lib/permissions/guards";

export default async function TenantDashboardPage() {
  const session = await requireTenantAccess();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tenant Portal</h1>
      <p className="text-sm text-neutral-500">
        Welcome back, {session.fullName}.
      </p>
      <div className="rounded-2xl border p-4">
        <p>Role: {session.activeOrgRole}</p>
        <p>Organization: {session.activeOrgId}</p>
      </div>
    </div>
  );
}