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

function getRoleCode(label: string) {
  return label
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function RoleMembersPage({ params }: Props) {
  const { role } = await params;
  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) notFound();

  const members = await getRoleMembers(normalizedRole);
  const meta = ROLE_META[normalizedRole];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-5 p-5 sm:p-6">
          <Link
            href="/staff"
            className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <span aria-hidden="true" className="mr-2">
              ←
            </span>
            Back to directories
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                {getRoleCode(meta.label)}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Organisation role
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {meta.label} Directory
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {meta.description}
                </p>
              </div>
            </div>

            <Link
              href={`/staff/${normalizedRole.toLowerCase()}/new`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Add {meta.label}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Total members</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {members.length.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Role</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {meta.label}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Directory status</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {members.length > 0 ? "Active" : "No members yet"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
            Members
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            View and manage members assigned to this role.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                No {meta.label.toLowerCase()} members found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Add the first member to start managing this directory.
              </p>

              <div className="mt-4">
                <Link
                  href={`/staff/${normalizedRole.toLowerCase()}/new`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Add {meta.label}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 lg:grid-cols-2">
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/staff/${normalizedRole.toLowerCase()}/${member.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-950">
                      {member.user.fullName}
                    </h3>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {member.user.email ?? "No email address"}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {meta.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {member.user.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      Scope
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {member.scopeType}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                      Phone
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {member.user.phone ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center text-sm font-medium text-slate-700 transition group-hover:text-slate-950">
                  Open details
                  <span className="ml-2 transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}