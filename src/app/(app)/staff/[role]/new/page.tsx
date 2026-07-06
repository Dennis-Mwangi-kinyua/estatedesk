import { notFound } from "next/navigation";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { createMembership } from "@/features/staff/actions/create-membership";
import { MemberForm } from "@/features/staff/components/member-form";
import {
  ROLE_META,
  normalizeStaffRole,
} from "@/features/staff/constants/role-meta";
import { getCaretakerAssignmentTargets } from "@/app/(app)/staff/new/_lib/queries";

type Props = {
  params: Promise<{ role: string }>;
};

export default async function NewRoleMemberPage({ params }: Props) {
  const { role } = await params;
  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) {
    notFound();
  }

  const orgId = await requireCurrentOrgId();
  const roleMeta = ROLE_META[normalizedRole];

  const assignmentTargets =
    normalizedRole === "CARETAKER"
      ? await getCaretakerAssignmentTargets(orgId)
      : undefined;
  const isCaretaker = normalizedRole === "CARETAKER";

  return (
    <div className="grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Staff setup
            </p>

            <h1 className="mt-2 text-2xl font-bold text-neutral-950">
              Add {roleMeta.label}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              {isCaretaker
                ? "Assign the caretaker to a property or apartment/block first, then capture profile details and login credentials."
                : `Create a verified ${roleMeta.label.toLowerCase()} account with profile details and login credentials.`}
            </p>
          </div>

          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
            Role: {normalizedRole}
          </span>
        </div>

        <div className="mt-6">
          <MemberForm
            action={createMembership}
            submitLabel={`Create ${roleMeta.label}`}
            lockedRole={normalizedRole}
            assignmentTargets={assignmentTargets}
          />
        </div>
      </section>

      <aside className="space-y-3">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-sm font-semibold text-emerald-900">
            Verified staff login
          </h2>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            The account is created with a username, verified email, temporary
            password, and the locked role shown here.
          </p>
        </div>

        {isCaretaker ? (
          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4">
            <h2 className="text-sm font-semibold text-sky-900">
              Property or apartment mapping
            </h2>
            <p className="mt-1 text-sm leading-6 text-sky-800">
              Assign a whole property for portfolio coverage, or choose an
              apartment/block for a narrower scope. Apartments can share
              multiple caretakers.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Streamlined setup
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Enter identity details, set login credentials, and save. No
              property mapping is needed for this role.
            </p>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Setup order
          </p>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            {isCaretaker ? (
              <>
                <p>1. Assign the property or apartment/block.</p>
                <p>2. Enter profile and HR details.</p>
                <p>3. Set login credentials and review.</p>
              </>
            ) : (
              <>
                <p>1. Confirm the locked role.</p>
                <p>2. Enter profile and HR details.</p>
                <p>3. Set login credentials.</p>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
