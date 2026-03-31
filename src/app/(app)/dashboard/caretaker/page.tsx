import { requireCaretakerAccess } from "@/lib/permissions/guards";

export default async function CaretakerDashboardPage() {
  const session = await requireCaretakerAccess();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Caretaker Dashboard</h1>
      <p className="text-sm text-neutral-500">
        Welcome back, {session.fullName}.
      </p>
      <div className="rounded-2xl border p-4">
        <p>Role: {session.activeOrgRole}</p>
        <p>Scope: {session.membershipScope?.scopeType ?? "N/A"}</p>
      </div>
    </div>
  );
}