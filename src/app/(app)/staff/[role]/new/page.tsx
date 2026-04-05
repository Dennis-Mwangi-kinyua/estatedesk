import { notFound } from "next/navigation";
import { createMembership } from "@/features/staff/actions/create-membership";
import { MemberForm } from "@/features/staff/components/member-form";

const ALLOWED_ROLES = [
  "ADMIN",
  "MANAGER",
  "OFFICE",
  "ACCOUNTANT",
  "CARETAKER",
  "TENANT",
] as const;

type StaffRole = (typeof ALLOWED_ROLES)[number];

type Props = {
  params: Promise<{ role: string }>;
};

function normalizeRole(role: string): StaffRole | null {
  const upper = role.toUpperCase() as StaffRole;
  return ALLOWED_ROLES.includes(upper) ? upper : null;
}

export default async function NewRoleMemberPage({ params }: Props) {
  const { role } = await params;
  const normalizedRole = normalizeRole(role);

  if (!normalizedRole) notFound();

  return (
    <div className="max-w-2xl rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-neutral-950">
        Add {normalizedRole}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Create a new organisation member under this role.
      </p>

      <div className="mt-6">
        <MemberForm
          action={createMembership}
          submitLabel={`Create ${normalizedRole}`}
          lockedRole={normalizedRole}
        />
      </div>
    </div>
  );
}