import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoleMembers } from "@/features/staff/queries/get-role-members";
import {
  ROLE_META,
  normalizeStaffRole,
} from "@/features/staff/constants/role-meta";

type Props = {
  params: Promise<{ role: string }>;
};

export default async function RoleMembersPage({ params }: Props) {
  const { role } = await params;
  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) notFound();

  const members = await getRoleMembers(normalizedRole);
  const meta = ROLE_META[normalizedRole];

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl">{meta.emoji}</div>
            <p className="mt-2 text-sm text-neutral-500">Organisation role</p>
            <h1 className="mt-1 text-2xl font-bold text-neutral-950">
              {meta.label}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">{meta.description}</p>
          </div>

          <Link
            href={`/staff/${normalizedRole.toLowerCase()}/new`}
            className="rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
          >
            Add {meta.label}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/staff/${normalizedRole.toLowerCase()}/${member.id}`}
            className="rounded-[24px] border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{member.user.fullName}</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  {member.user.email ?? "No email"}
                </p>
              </div>

              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}
              >
                {meta.label}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-neutral-600">
              <p>Status: {member.user.status}</p>
              <p>Phone: {member.user.phone ?? "—"}</p>
              <p>Scope: {member.scopeType}</p>
            </div>

            <div className="mt-4 text-sm font-medium text-neutral-800">
              Open details →
            </div>
          </Link>
        ))}

        {members.length === 0 && (
          <div className="rounded-[24px] border border-dashed bg-white p-6 text-sm text-neutral-500">
            No {meta.label.toLowerCase()} members yet.
          </div>
        )}
      </div>
    </div>
  );
}